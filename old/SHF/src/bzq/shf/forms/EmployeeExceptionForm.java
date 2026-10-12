/*
 * Created on 12/05/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

import bzq.shf.bean.ExceptionBean;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class EmployeeExceptionForm extends ExceptionBean{

	
	protected String from;
	protected String to;
	protected String employeeId;
	protected int fullday;
	

	
	public int getFullday() {
		return fullday;
	}

	public void setFullday(int fullday) {
		this.fullday = fullday;
	}

	/**
	 * @return
	 */
	public String getEmployeeId() {
		return employeeId;
	}

	/**
	 * @return
	 */
	public String getFrom() {
		return from;
	}

	/**
	 * @return
	 */
	public String getTo() {
		return to;
	}

	/**
	 * @param string
	 */
	public void setEmployeeId(String string) {
		employeeId = string;
	}

	/**
	 * @param string
	 */
	public void setFrom(String string) {
		from = string;
	}

	/**
	 * @param string
	 */
	public void setTo(String string) {
		to = string;
	}

}
