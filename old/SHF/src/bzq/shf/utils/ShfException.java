package bzq.shf.utils;

/*
 * Created on 29/01/2008
 */


import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;

import bzq.general.BaseException;

public class ShfException extends BaseException {

	public ShfException(ActionError actionError) {
		super(actionError);
	}

	public ShfException(ActionError actionError, Exception e) {
		super(actionError, e);
	}

	public ShfException(ActionErrors actionErrors) {
		super(actionErrors);
	}

	public ShfException(String errorDescription) {
		super(errorDescription);
	}

	public ShfException(String errorDescription, Exception e) {
		super(errorDescription, e);
	}

	public String definedExceptionType() {
		return null;
	}
}
