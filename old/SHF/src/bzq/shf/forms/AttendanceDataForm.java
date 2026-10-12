/*
 * Created on 25/12/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

import java.util.Date;
import bzq.shf.bean.AgentDayBean;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class AttendanceDataForm extends AgentDayBean{
	
	protected int reportRequired;
	protected Date reportApproveTime;
	
	protected int missingDays;
	
	static{
		fieldsMapping.put("APPROVED_TIME","reportApproveTime");
	}
	
	public AttendanceDataForm(){
		super();
	}

	/**
	 * @return
	 */
	public int getReportRequired() {
		return reportRequired;
	}

	/**
	 * @param i
	 */
	public void setReportRequired(int i) {
		reportRequired = i;
	}

	/**
	 * @return
	 */
	public int getMissingDays() {
		return missingDays;
	}

	/**
	 * @param i
	 */
	public void setMissingDays(int i) {
		missingDays = i;
	}

	/**
	 * @return
	 */
	public Date getReportApproveTime() {
		return reportApproveTime;
	}

	/**
	 * @param date
	 */
	public void setReportApproveTime(Date date) {
		reportApproveTime = date;
	}

}
