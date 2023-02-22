
console.log(module.exports);
exports.getDate = function() {
    const today = new Date();
    const options = {
        weekday: "long",
        day: "numeric",
        month: "long"
    };

    return today.toLocaleDateString("fr-CA");
}

exports.getDay = function() {
    const today = new Date();
    const options = {
        weekday: "long",
    };

    return today.toLocaleDateString("en-US", options);
}

console.log(module.exports);
