/*
 * Created on 13/07/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

import bzq.shf.bean.ReduceShiftBean;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ShiftReduceListForm extends ReduceShiftBean{ 
	
	public ShiftReduceListForm() {
		super();
	}
	
	protected String automaticApprove;
	protected String sourceWindow;
	protected String startTime;
	protected String endTime;

	/**
	 * @return
	 */
	public String getAutomaticApprove() {
		return automaticApprove;
	}

	/**
	 * @param string
	 */
	public void setAutomaticApprove(String string) {
		automaticApprove = string;
	}

	/**
	 * @return
	 */
	public String getSourceWindow() {
		return sourceWindow;
	}

	/**
	 * @param string
	 */
	public void setSourceWindow(String string) {
		sourceWindow = string;
	}

	/**
	 * @return
	 */
	public String getEndTime() {
		return endTime;
	}

	/**
	 * @return
	 */
	public String getStartTime() {
		return startTime;
	}

	/**
	 * @param string
	 */
	public void setEndTime(String string) {
		endTime = string;
	}

	/**
	 * @param string
	 */
	public void setStartTime(String string) {
		startTime = string;
	}

}
