/*
 * Created on Jan 1, 2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.transfer;

import java.util.HashMap;

import bzq.shf.bean.ShfBaseBean;

/**
 * @author 03445956
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class BaseAdminForm extends ShfBaseBean {

	private String action = null;
	/* (non-Javadoc)
	 * @see bzq.forms.BaseForm#getFieldsMapping()
	 */
	public HashMap getFieldsMapping() {
		return null;
	}

	/**
	 * @return
	 */
	public String getAction() {
		return action;
	}

	/**
	 * @param string
	 */
	public void setAction(String string) {
		action = string;
	}

}
