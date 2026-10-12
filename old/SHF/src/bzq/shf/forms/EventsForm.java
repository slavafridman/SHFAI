/*
 * Created on 07/12/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

import bzq.shf.bean.EventReasonBean;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class EventsForm extends AttendanceDataForm{

	private EventReasonBean[] reasons=null;
	private int branch;
	private int eventType;
	

	/**
	 * @return
	 */
	public EventReasonBean[] getReasons() {
		return reasons;
	}

	/**
	 * @param beans
	 */
	public void setReasons(EventReasonBean[] beans) {
		reasons = beans;
	}

	


	
	/**
	 * @return
	 */
	public int getEventType() {
		return eventType;
	}

	/**
	 * @param i
	 */
	public void setEventType(int i) {
		eventType = i;
	}

	/**
	 * @return
	 */
	public int getBranch() {
		return branch;
	}

	/**
	 * @param i
	 */
	public void setBranch(int i) {
		branch = i;
	}

	

}
