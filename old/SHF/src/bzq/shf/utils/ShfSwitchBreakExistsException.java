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
public class ShfSwitchBreakExistsException extends ShfException{
	
	public ShfSwitchBreakExistsException(ActionError actionError) {
		super(actionError);
	}

	public ShfSwitchBreakExistsException(ActionError actionError, Exception e) {
		super(actionError, e);
	}

	public ShfSwitchBreakExistsException(ActionErrors actionErrors) {
		super(actionErrors);
	}

	public ShfSwitchBreakExistsException(String errorDescription) {
		super(errorDescription);
	}

	public ShfSwitchBreakExistsException(String errorDescription, Exception e) {
		super(errorDescription, e);
	}
}
