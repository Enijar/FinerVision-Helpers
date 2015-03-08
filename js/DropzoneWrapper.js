var DropzoneWrapper = {

    debug: true, // denotes whether debugging mode is enabled

    /**
     * A wrapper around dropzone for ease of use
     * notable features include the ability to preload
     * the already uploaded images given url which returns
     * the list of images along with the size of the image
     *
     * @param uploader_id string the id of the element to which we are
     * binding Dropzone, this needs to start with a hashtag
     *
     * @param input_id string the id of the input element where to save
     * the image urls once uploaded, this needs to start with a hashtag
     *
     * @param user_options array user options which are passed to Dropzone,
     * note that the "preload_images_link" option is required so the
     * scripts knows where to preload the images from
     *
     * @return {Dropzone|boolean}
     */
    dropzoneUpload: function(uploader_id, input_id, user_options) {

        var self = this;

        if ( ! self.checkIfAllRequiredOptionsArePassedAndCorrect(uploader_id, input_id, user_options) ) {
            return false;
        }

        Dropzone.autoDiscover = false; // disable Dropzone's auto discover feature

        var options = {
            url: user_options.uploadURL ? user_options.uploadURL : 'https://static.finervision.com/upload.php', // upload to S3
            maxFileSize: user_options.maxFiles ? user_options.maxFiles : 1,
            maxFiles: user_options.maxFiles ? user_options.maxFiles : 1,
            addRemoveLinks: true,
            dictCancelUpload: 'Remove',
            removedfile: function(file) {
                var previewElement = $(file.previewElement); // load up in jquery
                var image_url = previewElement.attr('data-image-url');
                self.removeFromUploadedImages(input_id, image_url);

                previewElement.remove();
            },
            init: function() {
                var thisDropzone = this;

                this.on('success', function (file, response) {
                    var json = JSON.parse(response);

                    $(file.previewElement).attr('data-image-url', json.full_link);

                    if ( self.uploadingMoreThanOneFile(user_options) ) {
                        self.saveFileToInputField(input_id, json.full_link, json.file_size);
                    } else {
                        $(input_id).val(json.filename);
                    }

                    return true;
                });

                if ( user_options.preload_images_link != undefined ) {
                    // preload the already uploaded images from the specified link, this should return a JSON list with the image urls and sizes
                    $.getJSON( user_options.preload_images_link + '?id=' + self.getParameterByName('id'), function(data) { // get the json response
                        var mockFile = { name: '', size: data.size }; // here we get the file name and size as response

                        thisDropzone.options.addedfile.call(thisDropzone, mockFile);
                        thisDropzone.options.thumbnail.call(thisDropzone, mockFile, data.image); // image link
                    });
                }
            }
        };

        var dropzone = new Dropzone(uploader_id, options);
    },

    /**
     * If the users are allowed to upload more than one file
     * returns true else false, this is decided based on
     * the maxFiles property inside the user_options
     * param
     *
     * @param user_options
     * @returns {boolean}
     */
    uploadingMoreThanOneFile: function(user_options) {
        if ( user_options.maxFiles == undefined ) {
            return false;
        } else if ( user_options.maxFiles < 2 ) {
            return false;
        }

        return true;
    },

    /**
     * Gets the value of an input field and tries to parse it as JSON
     * if it fails parsing it just returns an empty array
     *
     * @param input_id
     * @returns {object}
     */
    getAndDecodeImagesFromInputField: function(input_id) {
        var json = $(input_id).val();

        if ( json == $.trim('') ) {
            json = [];
        } else {
            try {
                json = JSON.parse(json);
            } catch (e) {
                json = [];
            }
        }

        return json;
    },

    /**
     * Gets the value of an input field, tries to parse into an array
     * using JSON.parse adds new string(file name) to the end of the
     * array then stringifies and saves it to the input field
     *
     * @param input_id {string} the input element id with a hashtag
     * @param filename {url} the image url
     * @param file_size int the file size of the image
     */
    saveFileToInputField: function(input_id, filename, file_size) {
        var self = this;
        var current_images = self.getAndDecodeImagesFromInputField(input_id);
        current_images.push({image: filename, size:file_size});
        self.encodeImagesArrayAndPutIntoField(input_id, current_images);
    },

    /**
     * Encodes and an array as JSON and saves to an input
     *
     * @param input_id string the input id to save it to
     * @param images array the array to save
     */
    encodeImagesArrayAndPutIntoField: function(input_id, images) {
        $(input_id).val(JSON.stringify(images));
    },

    removeFromUploadedImages: function(input_id, image_url) {
        var self = this;
        var current_images = self.getAndDecodeImagesFromInputField(input_id);
        var new_images = self.removeImageFromList(image_url, current_images);
        $(input_id).val(JSON.stringify(new_images));
    },

    /**
     * Searches for an element in an array and removes it
     *
     * @param image string the image to search for
     * @param list array the array to search into
     * @returns array
     */
    removeImageFromList: function(image, list) {
        for ( var i = 0; i < list.length; i++ ) {
            if ( list[i].image == image) {
                list[i].deleted = 1;
            }
        }

        return list;
    },

    /**
     * Verifies parameters for the dropzoneUploadFunction
     *
     * @param uploader_id {string}
     * @param input_id {string}
     * @param user_options {object}
     * @returns {boolean}
     */
    checkIfAllRequiredOptionsArePassedAndCorrect: function(uploader_id, input_id, user_options) {
        // TODO: verify that the passed in options are correct, this should throw a proper error

        // required: user_options.preload_images_link
        // required: uploader_id valid id with a hashtag
        // required: input_id valid id with a hashtag
        return true;
    },

    /**
     * Tries to get a query parameter's value
     *
     * @param name {string} the query parameter's name
     * @returns {string}
     */
    getParameterByName: function(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    },

    /**
     * Log to the console when in debug mode and when
     * the browser has a console to log to
     *
     * @param data {*} data to log
     */
    log: function(data) {
        var self = this;

        if(window.console && self.debug) {
            console.log(data);
        }
    }



};