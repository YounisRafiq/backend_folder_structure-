const Handler = (reqHandler) => {

(req , res , next) => {
    Promise.resolve(reqHandler(req , res , next)).catch((err) => next(err))
}
}    


export { Handler };



