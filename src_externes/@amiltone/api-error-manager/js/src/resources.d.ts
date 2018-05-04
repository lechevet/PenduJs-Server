declare var _default: {
    internalError: {
        code: number;
        message: string;
    };
    forbiddenError: {
        code: number;
        message: string;
    };
    missingField: {
        code: number;
        message: string;
    };
    tooLongURI: {
        code: number;
        message: string;
    };
    notFound: {
        code: number;
        message: string;
    };
    jwt: {
        code: number;
        message: string;
        sub_errors: {
            malformed: {
                code: number;
                message: string;
            };
            missingSignature: {
                code: number;
                message: string;
            };
            invalidSignature: {
                code: number;
                message: string;
            };
            missingToken: {
                code: number;
                message: string;
            };
            unknown: {
                code: number;
                message: string;
            };
        };
    };
};
export default _default;
