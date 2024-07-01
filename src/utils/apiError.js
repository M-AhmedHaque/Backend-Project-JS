class apiError extends Error{
    constructor(
        errorcode,
        message,
        errors = [],
        stack = ""
    ){
        super(message)
        this.errorcode=errorcode
        this.message=message
        this.errors=errors
        this.success=false
        this.data=null
        if(stack){
            this.stack=stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}
export { apiError }