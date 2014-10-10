(function ($) {
  Drupal.behaviors.image_insane = {

    attach: function (context, settings) {

    	//	Check for File APIs support
			if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
				console.log('Sorry, File APIs are not fully supported in this browser');
			  return;
			}

			//	If any image insane container exists
			if( $('.image-insane-item', context).length){

				// Setup the dnd listeners - prevent native behaviour
				Drupal.behaviors.image_insane.preventWindowDnD();
				
				//	Add Wrapper for image insane items
				$('.image-insane-item').wrap('<div class="image-insane-drop-zone"></div>');

				//	Loop through image insane Drop Zones
				$('.image-insane-drop-zone').each(function(i){

					var dropZone = $(this).get(0);

					dropZone.addEventListener('dragover', Drupal.behaviors.image_insane.handleDragOver, false);
					dropZone.addEventListener('dragleave', Drupal.behaviors.image_insane.handleDragLeave, false);
					dropZone.addEventListener('drop', Drupal.behaviors.image_insane.handleFileSelect, false);

				});

			}

    },

    //	Function prevents native browser file-drop behaviour
    preventWindowDnD: function(){

    	window.addEventListener("dragover",function(e){
			  e = e || event;
			  e.preventDefault();
			},false);
			window.addEventListener("drop",function(e){
			  e = e || event;
			  e.preventDefault();
			},false);

    },

    //	
    handleDragOver: function(evt) {
		  evt.stopPropagation();
		  evt.preventDefault();
		  evt.dataTransfer.dropEffect = 'copy';
		  $(evt.target).parent().css('border-color', 'red');
		},

		//
		handleDragLeave: function(evt) {
		  evt.stopPropagation();
		  evt.preventDefault();
		  $(evt.target).parent().css('border-color', '');
		},

		handleFileSelect: function(evt) {

		  evt.stopPropagation();
		  evt.preventDefault();

		  //	Element properties and attributes
		  var data_entity_id = $(evt.target).attr('data-entity-id');
		  var data_entity_type = $(evt.target).attr('data-entity-type');
		  var data_image_field_name = $(evt.target).attr('data-image-field-name');
		  var data_image_delta = $(evt.target).attr('data-image-delta');
		  var data_image_style = $(evt.target).attr('data-image-style');

		  // FileList object
		  var files = evt.dataTransfer.files; 

		  //	We will be working only with ONE file object even if multiple images dropped
		  var fileIndex = 0;
		  var f = files[fileIndex];

	    var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (function(theFile) {
        return function(e) {

          //	Collect the JSON and send as POST request
     			var json_data = {
     				name: f.name,
						base64: e.target.result,
						entity_id: data_entity_id,
						entity_type: data_entity_type,
						image_field_name: data_image_field_name,
						image_delta: data_image_delta,
						image_style: data_image_style
					}
					data_to_send = JSON.stringify(json_data);
                  
          $.ajax({
            type: "POST",
            url: Drupal.settings.image_insane.post_url,
            data: { json: data_to_send },
            success: function(data) {
  					  console.log('successss!');
  					  console.log(data);
  					  $(evt.target).attr('src', data);
            }
  					error: function(data) {
  						console.log("failed post action!");
  					}
          });

        };
      })(f);

      // Read in the image file as a data URL.
      reader.readAsDataURL(f);

		  $('.image-insane-drop-zone').css('border-color', '');

		}

  }

})(jQuery);
