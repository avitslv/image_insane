(function ($) {
  Drupal.behaviors.image_insane = {
  	/*
  	 *	Define all file types that can be uploaded 
  	 *	(file types defined for Drupal field instance 
  	 *	will be checked on server side)
  	 */
  	commonImageTypes: [
  		'image/gif', 'image/jpeg', 'image/pjpeg', 'image/png'
  	],
    attach: function (context, settings) {

    	//	Check for File APIs support
			if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
				Drupal.behaviors.image_insane.showMessage([Drupal.t('Sorry, File APIs are not fully supported in this browser.')]);
			  return;
			}

			//	If there is at least one image with drag and drop replacement functionality
			if(Drupal.settings.image_insane.count != 'undefined' && Drupal.settings.image_insane.count > 0){

				//	Prevent browser file-drop native behaviour
				Drupal.behaviors.image_insane.preventWindowFileDrop();

				//	Define Image Insane element wrapper and prefix
				var element_wrapper = '<div class="image-insane-drop-zone"></div>';
				var element_prefix = '<div class="icon-image-insane"></div>';
				element_prefix += '<div class="icon-image-insane-loading"></div>';
				element_prefix += '<div class="image-insane-overlay-border"></div>';
				element_prefix += '<a href="#image-insane-save" class="icon-image-insane-save"></a>';
				element_prefix += '<a href="#image-insane-cancel" class="icon-image-insane-cancel"></a>';

				//	Loop through images
				for(var image_insane_id in Drupal.settings.image_insane.images){
					var image_insane_img = $('*[data-image-insane-id="'+image_insane_id+'"]');
					//	Wrap element with Image Insane DOM
					image_insane_img.wrap(element_wrapper).before(element_prefix);
					//	Select image drop zone element
					var image_insane_img_drop_zone = image_insane_img.parent('.image-insane-drop-zone');
					var dropZone = image_insane_img_drop_zone.get(0);
					//	Attach event listeners to image insane drop zones
					dropZone.addEventListener('dragover', Drupal.behaviors.image_insane.handleDragOver, false);
					dropZone.addEventListener('dragleave', Drupal.behaviors.image_insane.handleDragLeave, false);
					dropZone.addEventListener('drop', Drupal.behaviors.image_insane.handleDrop, false);
				}

			}

		},

		/*
		 *	Function that handles drop event
		 */
		handleDrop: function(evt){
			evt.stopPropagation();
		  evt.preventDefault();
		  //	Get Image Insane ID for selected image
		  var image_insane_id = $('img', $(evt.target).parent('.image-insane-drop-zone')).attr('data-image-insane-id');
		  //	Process selected file in separate function
		  Drupal.behaviors.image_insane.readAndProcessFile(evt, image_insane_id);
		},

		/*
		 *	Function that checks, reads and processes selected file
		 */
		readAndProcessFile: function(evt, image_insane_id){

			//	Remove dragover class from Drop Zone
			$(evt.target).parent('.image-insane-drop-zone').removeClass('dragover');
			//	Unbind previous click events for Image Insane action controls
			var image_insane_img = $('*[data-image-insane-id="'+image_insane_id+'"]');
			var image_insane_img_drop_zone = image_insane_img.parent('.image-insane-drop-zone');
			$('.icon-image-insane-save, .icon-image-insane-cancel', image_insane_img_drop_zone).unbind('click');
			//	Check if dropped element exists and is a file - image
			if(
		  	!evt.dataTransfer.files[0] || 
		  	!evt.dataTransfer.files[0].type ||
		  	!Drupal.behaviors.image_insane.inArray(evt.dataTransfer.files[0].type, Drupal.behaviors.image_insane.commonImageTypes)
		  ){
		  	Drupal.behaviors.image_insane.showMessage([Drupal.t('File you selected is not a supported image type.')]);
				return;
			}
			//	Get FileList object, select only first image even if multiple images dropped
		  var f = evt.dataTransfer.files[0];
			//	Check if dropped image does not exceed max filesize on client side
			//	Max Filesize assumed to be 20MB
			//	@todo: what is reasonable max filesize to transfer encoded as base64?
			if(f.size >= 20000000){
		  	Drupal.behaviors.image_insane.showMessage([Drupal.t('File you selected exceeds maximum filesize of 20MB.')]);
				return;
			}
			//	Add Loading class to Drop Zone
			$(evt.target).parent('.image-insane-drop-zone').addClass('loading');

		  //	Create new FileReader object
	    var reader = new FileReader();
	    //	Handle FileReader error event
	    reader.onerror = function(){
        //	Remove Loading class to Drop Zone
				$(evt.target).parent('.image-insane-drop-zone').removeClass('loading');
		  	Drupal.behaviors.image_insane.showMessage(['There was an error reading your file.']);
      };
      //	Handle FileReader onload (success) event
	    reader.onload = function(){

        //	Collect data and send as POST request
   			var json_data = {
   				operation: 'preview',
   				name: f.name,
					base64: reader.result,
					entity_id: Drupal.settings.image_insane.images[image_insane_id].entity_id,
					entity_type: Drupal.settings.image_insane.images[image_insane_id].entity_type,
					image_field_name: Drupal.settings.image_insane.images[image_insane_id].image_field_name,
					image_delta: Drupal.settings.image_insane.images[image_insane_id].image_delta,
					image_style: Drupal.settings.image_insane.images[image_insane_id].image_style,
				}
				data_to_send = JSON.stringify(json_data);
      	$.ajax({
          type: "POST",
          url: Drupal.settings.image_insane.post_url,
          data: { json: data_to_send },
          success: function(data) {

          	if($.parseJSON(data) && $.parseJSON(data).status == 'success'){

          		//	Parse response data
	          	var response_data = $.parseJSON(data);
							var image_insane_img = $('*[data-image-insane-id="'+image_insane_id+'"]');
							//	Change selected image src
							image_insane_img.attr('src', response_data.data.image_url);
							//	Set the preview image url as temporary value in Image Insane settings
							Drupal.settings.image_insane.images[image_insane_id].image_url_temp = response_data.data.image_url;
							//	Remove default width and height attributes for image to apply the new ratio
						  image_insane_img.removeAttr('width');
						  image_insane_img.removeAttr('height');
						  //	Remove Loading class from Drop Zone, add Preview class
							$(evt.target).parent('.image-insane-drop-zone').removeClass('loading');
							$(evt.target).parent('.image-insane-drop-zone').addClass('preview');

							//	Update the json_data with newly uploaded file ID (fid)
  					  json_data.fid = response_data.data.fid;
  					  //	Add click events to controls
  					  Drupal.behaviors.image_insane.attachClickControls(image_insane_img, image_insane_id, json_data);

  					//	If status error, display error messages
  					}else if($.parseJSON(data) && $.parseJSON(data).status == 'error'){

  						//	Parse response data
	          	var response_data = $.parseJSON(data);
  						//	Remove Loading class from Drop Zone
							$(evt.target).parent('.image-insane-drop-zone').removeClass('loading');
							//	Output error messages
							Drupal.behaviors.image_insane.showMessage(response_data.message);

          	}else{
		  				Drupal.behaviors.image_insane.showMessage([Drupal.t('There was an error processing your file.')]);
          	}

          },
					error: function(data) {
						Drupal.behaviors.image_insane.showMessage([Drupal.t('There was an error processing your file.')]);
					},
        });

      };
      //	Read the contents of file
      reader.readAsDataURL(f);

		},

		/*
		 *	Function that adds and handles click events for Image Insane controls - save/cancel
		 */
    attachClickControls: function(image_insane_img, image_insane_id, json_data){

    	var image_insane_img_drop_zone = image_insane_img.parent('.image-insane-drop-zone');
    	//	Add click event listener for action buttons
    	//	Preview state action - Save image changes
    	$('.icon-image-insane-save', image_insane_img_drop_zone).click(function(e){
				e.preventDefault();
				//	Add "loading" state class
				image_insane_img_drop_zone.addClass('loading');
				//	Set operation type and perform saving the entity
				json_data.operation = 'save';
				data_to_send = JSON.stringify(json_data);
				$.ajax({
          type: "POST",
          url: Drupal.settings.image_insane.post_url,
          data: { json: data_to_send },
          success: function(data) {
					  if($.parseJSON(data) && $.parseJSON(data).status == 'success'){
					  	//	After saving set new image URL as the original (saved one)
					  	Drupal.settings.image_insane.images[image_insane_id].image_original = Drupal.settings.image_insane.images[image_insane_id].image_url_temp;
					  	//	Remove "preview" and "loading" state class
					  	image_insane_img_drop_zone.removeClass('preview').removeClass('loading');
					  	//	Unbind click event for Image Insane action controls
					  	$('.icon-image-insane-save, .icon-image-insane-cancel', image_insane_img_drop_zone).unbind('click');
					  }else{
		  				Drupal.behaviors.image_insane.showMessage([Drupal.t('There was an error saving the entity.')]);
					  }

          },
					error: function(data) {
						Drupal.behaviors.image_insane.showMessage([Drupal.t('There was an error saving the entity.')]);
					},
        });

			});
		
			//	Preview state action - Cancel image changes
			$('.icon-image-insane-cancel', image_insane_img_drop_zone).click(function(e){

				e.preventDefault();
				//	Change selected image src back to original
				image_insane_img.attr('src', Drupal.settings.image_insane.images[image_insane_id].image_original);
				//	Remove "preview" state class
				image_insane_img_drop_zone.removeClass('preview');
				//	Unbind click event for Image Insane action controls
				$('.icon-image-insane-save, .icon-image-insane-cancel', image_insane_img_drop_zone).unbind('click');

			});

    },

		/*
		 *	Function that handles dragover event over Drop Zone
		 */
    handleDragOver: function(evt) {
		  evt.stopPropagation();
		  evt.preventDefault();
		  evt.dataTransfer.dropEffect = 'copy';
		  //	Check if dragover element is a file - image
		  if(
		  	evt.dataTransfer.items[0] && 
		  	evt.dataTransfer.items[0].type &&
		  	Drupal.behaviors.image_insane.inArray(evt.dataTransfer.items[0].type, Drupal.behaviors.image_insane.commonImageTypes)
		  ){
		  	//	Apply dragover class to Drop Zone if file type is an image
		  	$(evt.target).parent('.image-insane-drop-zone').addClass('dragover');
		  }

		},

		/*
		 *	Function that handles dragleave event over Drop Zone
		 */
    handleDragLeave: function(evt) {
		  evt.stopPropagation();
		  evt.preventDefault();
		  //	On drag over overlay-border will be shown,
		  //	therefore triggering false "leave" from img element
		  //	We will react only on "overlay-border" leave
		  if(evt.target.localName != 'img'){
		  	$(evt.target).parent('.image-insane-drop-zone').removeClass('dragover');
		  }
		},

		/*
		 *	Function prevents browser file-drop native behaviour
     */
    preventWindowFileDrop: function(){
    	window.addEventListener('dragover', function(e){
			  e = e || event;
			  e.preventDefault();
			}, false);
			window.addEventListener('drop', function(e){
			  e = e || event;
			  e.preventDefault();
			}, false);
    },

    /*
     *	Helper function: checks if array contains element
     */
    inArray: function (needle, haystack) {
    	var length = haystack.length;
    	for(var i = 0; i < length; i++) {
    		if(haystack[i] == needle) return true;
    	}
    	return false;
		},

		/*
		 *	Function that creates and outputes message box
		 */
		showMessage: function(message){

			var image_insane_message_box = '<div class="image-insane-message-box">';
			image_insane_message_box += '<div class="icon-image-insane"></div>';
			//	Build message
			image_insane_message_box += '<div class="image-insane-message">';
			for(key in message){
				image_insane_message_box += message[key] + '</br>';
			}
			image_insane_message_box += '</div>';
			image_insane_message_box += '</div>';

			Drupal.behaviors.image_insane.createMessageBoxInstance($(image_insane_message_box));

		},

		createMessageBoxInstance: function(messageBox){
			//	Hide other/previous message boxes
			$('.image-insane-message-box').hide();
			//	Append and show the latest one only
			$('body').append(messageBox);
			setTimeout(function(){
				messageBox.remove();
			}, 4000);
		},


  }
})(jQuery);