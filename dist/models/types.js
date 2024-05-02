export var conditionType;
(function (conditionType) {
    conditionType["!="] = "!=";
    conditionType["<"] = "<";
    conditionType["<="] = "<=";
    conditionType["=="] = "==";
    conditionType[">"] = ">";
    conditionType[">="] = ">=";
    conditionType["array-contains"] = "array-contains";
    conditionType["array-contains-any"] = "array-contains-any";
    conditionType["in"] = "in";
    conditionType["not-in"] = "not-in";
})(conditionType || (conditionType = {}));
