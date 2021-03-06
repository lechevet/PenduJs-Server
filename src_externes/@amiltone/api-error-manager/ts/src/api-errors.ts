import APIError from './api-error'

export default class APIErrors {
  public errors : Array<APIError>;
  constructor(){
    this.errors = [];
  }

  public add(error:APIError):void {
    this.errors.forEach((e:any) => {
      if (e.statusCode !== error.statusCode) {
        throw new Error('[APIErrors] : You can only store identical status code errors on a single APIErrors instance');
      }
    });
    this.errors.push(error);
  };

  public hasError():Boolean {
    return this.errors.length > 0;
  };
};
