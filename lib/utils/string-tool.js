//判断str最后一个字符是不是endStr
exports.endWith =  (str,endStr) => {
    const d = str.length - endStr.length;
    return (d>=0&&str.lastIndexOf(endStr)==d);
};