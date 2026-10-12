/*
 * Created on 17/03/2009
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
public class AgentNotExistException extends ShfException {
	public AgentNotExistException(ActionError actionError) {
		super(actionError);
	}

	public AgentNotExistException(ActionError actionError, Exception e) {
		super(actionError, e);
	}

	public AgentNotExistException(ActionErrors actionErrors) {
		super(actionErrors);
	}

	public AgentNotExistException(String errorDescription) {
		super(errorDescription);
	}

	public AgentNotExistException(String errorDescription, Exception e) {
		super(errorDescription, e);
	}
}
