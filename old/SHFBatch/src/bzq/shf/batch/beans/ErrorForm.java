package bzq.shf.batch.beans;

import org.apache.struts.action.ActionForm;

/**
 * Insert the type's description here.
 * Creation date: (24/12/2001 14:49:03)
 * @author: Administrator
 */

public class ErrorForm extends ActionForm
{
    private java.lang.String errorCode;
    private java.lang.String errorDesc;
	public  java.lang.String errorKey;
/**
 * Insert the method's description here.
 * Creation date: (17/09/2003 13:07:01)
 * @return java.lang.String
 */
public java.lang.String getErrorCode() {
	return errorCode;
}
/**
 * Insert the method's description here.
 * Creation date: (17/09/2003 13:07:01)
 * @return java.lang.String
 */
public java.lang.String getErrorDesc() {
	return errorDesc;
}
/**
 * Insert the method's description here.
 * Creation date: (17/09/2003 13:07:01)
 * @return java.lang.String
 */
public java.lang.String getErrorKey() {
	return errorKey;
}
/**
 * Insert the method's description here.
 * Creation date: (17/09/2003 13:07:01)
 * @param newErrorCode java.lang.String
 */
public void setErrorCode(java.lang.String newErrorCode) {
	errorCode = newErrorCode;
}
/**
 * Insert the method's description here.
 * Creation date: (17/09/2003 13:07:01)
 * @param newErrorDesc java.lang.String
 */
public void setErrorDesc(java.lang.String newErrorDesc) {
	errorDesc = newErrorDesc;
}
/**
 * Insert the method's description here.
 * Creation date: (17/09/2003 13:07:01)
 * @param newErrorKey java.lang.String
 */
public void setErrorKey(java.lang.String newErrorKey) {
	errorKey = newErrorKey;
}
}
