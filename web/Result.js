function Result( errorMessage, errorCode, data ){
    this.errorCode = 200;
    this.errorMessage = errorMessage;
    this.data = {};
    if( errorCode ){
        this.errorCode = errorCode;
    }
    if( data ){
        this.data = data;
    }
}

module.exports = Result;