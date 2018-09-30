exports.blobOf = function blobOf(URI) {
    var XHR = new XMLHttpRequest();
    XHR.responseType = "blob";
    XHR.open("GET", URI);

    return new Promise(function(resolve, reject) {
        XHR.onload = function() {
            resolve(this.response);
        };
        XHR.onerror = reject;
        XHR.send();
    });
};

var DataURI = /^data:(.+?\/(.+?))?(;base64)?,(\S+)/;

exports.fileTypeOf = function fileTypeOf(URI) {
    var schema = /^(?:(\w+):)?.+?(?:\.(\w+))?$/.exec(URI);

    switch (schema[1]) {
        case "data":
            return {
                schema: "data",
                type: DataURI.exec(URI)[2]
            };
        case "blob":
            return exports.blobOf(URI).then(function(blob) {
                return {
                    schema: "blob",
                    type: blob.type
                };
            });
        default:
            return {
                schema: schema[1],
                type: schema[2]
            };
    }
};

var BlobBuilder =
    window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;

exports.toBlob = function toBlob(dataURI) {
    dataURI = DataURI.exec(dataURI);

    var type = dataURI[1],
        base64 = dataURI[3],
        data = dataURI[4];
    data = base64 ? window.atob(data) : data;

    var aBuffer = new ArrayBuffer(data.length);
    var uBuffer = new Uint8Array(aBuffer);

    for (var i = 0; data[i]; i++) uBuffer[i] = data.charCodeAt(i);

    if (!BlobBuilder) return new window.Blob([aBuffer], { type: type });

    var builder = new BlobBuilder();
    builder.append(aBuffer);
    return builder.getBlob(type);
};
