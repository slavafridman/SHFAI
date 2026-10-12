package bzq.shf.batch.utils;

import java.util.HashMap;

import bzq.shf.batch.beans.ErrorForm;

/**
 * Insert the type's description here.
 * Creation date: (16/06/2003 16:28:33)
 * @author: Eduard Katcherovski
 */
public class ErrorCodesLoader extends bzq.utils.DigesterWrapper {
	private HashMap errorList = null;
	
/**
 * UsersLoader constructor comment.
 * @param xmlFile java.io.File
 * @param debugDetail int
 * @param xmlValidation boolean
 */
public ErrorCodesLoader(
    java.io.File xmlFile,
    int debugDetail,
    boolean xmlValidation) {
    super(xmlFile, debugDetail, xmlValidation);
    errorList = new HashMap();
    //parse read xml content into ProcessBean (rule defined in the initDigester()
    try {
        parse();
    } catch (Exception e) {
        e.printStackTrace();
    }
}
public void addError(ErrorForm errorForm) {
	errorList.put(errorForm.getErrorKey(), errorForm);
}
/**
 * Insert the method's description here.
 * Creation date: (17/06/2003 09:01:52)
 * @return mdr.forms.LoginForm
 */
public final ErrorForm getErrorForm (String error) throws Exception {
	ErrorForm errorForm = (ErrorForm) errorList.get(error);

	if (errorForm == null)
		throw new Exception("error not found");
	return errorForm;
}
/**
 * Construct and return a digester that uses the new configuration

   addRule("app-config/app-info/version-info", "bzq.utils.AppInfo", "setAppInfo");
 
 * file format.
 */
protected void initDigester() { 
	addRule("errors/error","mdr.batch.beans.ErrorForm","addError");
}
}
