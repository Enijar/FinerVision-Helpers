# FinerVision-Helpers
Simple JS and PHP library of helper functions / classes to make development that little bit easier.

# DropzoneWrapper.js

### How to Use

```js
var DropzoneWrapper = new DropzoneWrapper;

DropzoneWrapper.dropzoneUpload('#test-uploader', '#test', {preload_images_link: 'get-uploaded-images.php', maxFiles: 3});
```