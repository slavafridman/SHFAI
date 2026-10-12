/*
 * Created on 04/03/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.utils;

import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ShiftLateException extends ShfException{
	
	public ShiftLateException(ActionError actionError) {
		super(actionError);
	}

	public ShiftLateException(ActionError actionError, Exception e) {
		super(actionError, e);
	}

	public ShiftLateException(ActionErrors actionErrors) {
		super(actionErrors);
	}

	public ShiftLateException(String errorDescription) {
		super(errorDescription);
	}

	public ShiftLateException(String errorDescription, Exception e) {
		super(errorDescription, e);
	}
}
