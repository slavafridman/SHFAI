/*
 * Created on 14/10/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

import java.util.Date;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ActivityCallsForm extends ActivityForm{
	
	protected float handleTime;
	protected int callsNumber;
	protected Date period_start;
	protected String  handleTimeString;
	
	static{
		fieldsMapping.put("WM_HANDLE_TIME","handleTime");
		fieldsMapping.put("WM_CALLVOL","callsNumber");
		fieldsMapping.put("WM_PERIOD_START","period_start");
	}
	
	

	/**
	 * @return
	 */
	public int getCallsNumber() {
		return callsNumber;
	}

	/**
	 * @return
	 */
	public float getHandleTime() {
		return handleTime;
	}

	/**
	 * @param i
	 */
	public void setCallsNumber(int i) {
		callsNumber = i;
	}

	/**
	 * @param f
	 */
	public void setHandleTime(float f) {
		handleTime = f;
	}
	

	/**
	 * @return
	 */
	public Date getPeriod_start() {
		return period_start;
	}

	/**
	 * @param date
	 */
	public void setPeriod_start(Date date) {
		period_start = date;
	}

	public String getHandleTimeString() {
		return handleTimeString;
	}

	public void setHandleTimeString(String handleTimeString) {
		this.handleTimeString = handleTimeString;
	}
	

}
