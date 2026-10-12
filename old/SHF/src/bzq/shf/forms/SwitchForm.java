/*
 * Created on 09/06/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

import java.util.HashMap;

import bzq.shf.bean.ShfBaseBean;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class SwitchForm extends ShfBaseBean{

	protected long firstDayId;
	protected long secondDayId;
	protected String message;
	
	public SwitchForm(){
		
	}
	
	public HashMap getFieldsMapping() {
		return null;
	}
	
	/**
	 * @return
	 */
	public long getFirstDayId() {
		return firstDayId;
	}

	/**
	 * @return
	 */
	public long getSecondDayId() {
		return secondDayId;
	}

	/**
	 * @param l
	 */
	public void setFirstDayId(long l) {
		firstDayId = l;
	}

	/**
	 * @param l
	 */
	public void setSecondDayId(long l) {
		secondDayId = l;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

}
