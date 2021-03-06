export default class APIError extends Error {
  public errorCode : Number;
  public errorMessage : string;
  public errorDetails : Object;
  public statusCode : Number;

  constructor(errorCode:Number, errorMessage:string, errorDetails:Object, statusCode:Number){
    super(errorMessage);
    this.errorCode = errorCode;
    this.errorMessage = errorMessage;
    this.errorDetails = errorDetails;
    this.statusCode = statusCode;
  }

  public getStatusCode():Number {
    return this.statusCode;
  }
};
