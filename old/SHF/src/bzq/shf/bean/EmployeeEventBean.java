/*
 * Created on 16/12/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.bean;

import java.util.Date;
import java.util.HashMap;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class EmployeeEventBean extends ShfBaseBean{
	protected static HashMap fieldsMapping = null;
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("EVENT_ID", "eventId");
		fieldsMapping.put("EVENT_TYPE", "reason");
		fieldsMapping.put("EMPLOYEE_ID", "employee_id");
		fieldsMapping.put("EVENT_TIME", "time");
		fieldsMapping.put("EMPLOYEE_DAY_ID", "employee_day_id");
		fieldsMapping.put("EVENT_LENGTH", "length");
		fieldsMapping.put("REMARK", "remark");
		fieldsMapping.put("STATUS", "status");
		fieldsMapping.put("CREATION_USER", "creation_user");
		fieldsMapping.put("CREATION_TIME", "creation_time");
		fieldsMapping.put("OTHER_EVENT_DESC", "otherEventDesc");
		fieldsMapping.put("REPORTED", "reported");
		fieldsMapping.put("SER_TYPE", "serType");
	}
	
	protected int eventId;
	protected int eventType;
	protected Date time;
	protected Date date;
	protected int length;
	protected int reason;
	protected String remark;
	protected int reported;
	protected int reportRequested;
	protected int status;
	protected String creation_user;
	protected Date creation_time;
	protected long employee_day_id;
	protected int employee_id;
	protected String otherEventDesc;
	protected String hour;
	protected int serType;
	protected int agentMood;

	/* (non-Javadoc)
	 * @see bzq.shf.bean.ShfBaseBean#getFieldsMapping()
	 */
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}

	
	public int getAgentMood() {
		return agentMood;
	}


	public void setAgentMood(int agentMood) {
		this.agentMood = agentMood;
	}

	/**
	 * @return
	 */
	public int getEventType() {
		return eventType;
	}

	/**
	 * @return
	 */
	public int getLength() {
		return length;
	}

	
	/**
	 * @return
	 */
	public int getReason() {
		return reason;
	}

	/**
	 * @return
	 */
	public String getRemark() {
		return remark;
	}

	/**
	 * @return
	 */
	public int getReportRequested() {
		return reportRequested;
	}

	/**
	 * @return
	 */
	public Date getTime() {
		return time;
	}

	

	/**
	 * @param i
	 */
	public void setEventType(int i) {
		eventType = i;
	}

	/**
	 * @param i
	 */
	public void setLength(int i) {
		length = i;
	}

	

	/**
	 * @param i
	 */
	public void setReason(int i) {
		reason = i;
	}

	/**
	 * @param string
	 */
	public void setRemark(String string) {
		remark = string;
	}

	/**
	 * @param i
	 */
	public void setReportRequested(int i) {
		reportRequested = i;
	}

	/**
	 * @param string
	 */
	public void setTime(Date d) {
		time = d;
	}

	/**
	 * @return
	 */
	public Date getCreation_time() {
		return creation_time;
	}

	/**
	 * @return
	 */
	public String getCreation_user() {
		return creation_user;
	}

	/**
	 * @return
	 */
	public Date getDate() {
		return date;
	}

	/**
	 * @return
	 */
	public long getEmployee_day_id() {
		return employee_day_id;
	}

	/**
	 * @return
	 */
	public int getEmployee_id() {
		return employee_id;
	}

	/**
	 * @return
	 */
	public int getEventId() {
		return eventId;
	}

	/**
	 * @return
	 */
	public String getOtherEventDesc() {
		return otherEventDesc;
	}

	/**
	 * @return
	 */
	public int getStatus() {
		return status;
	}

	/**
	 * @param map
	 */
	public static void setFieldsMapping(HashMap map) {
		fieldsMapping = map;
	}

	/**
	 * @param date
	 */
	public void setCreation_time(Date date) {
		creation_time = date;
	}

	/**
	 * @param string
	 */
	public void setCreation_user(String string) {
		creation_user = string;
	}

	/**
	 * @param date
	 */
	public void setDate(Date date) {
		this.date = date;
	}

	/**
	 * @param string
	 */
	public void setEmployee_day_id(long l) {
		employee_day_id = l;
	}

	/**
	 * @param string
	 */
	public void setEmployee_id(int id) {
		employee_id = id;
	}

	/**
	 * @param i
	 */
	public void setEventId(int i) {
		eventId = i;
	}

	/**
	 * @param string
	 */
	public void setOtherEventDesc(String string) {
		otherEventDesc = string;
	}

	/**
	 * @param i
	 */
	public void setStatus(int i) {
		status = i;
	}

	/**
	 * @return
	 */
	public String getHour() {
		return hour;
	}

	/**
	 * @param string
	 */
	public void setHour(String string) {
		hour = string;
	}

	/**
	 * @return
	 */
	public int getReported() {
		return reported;
	}

	/**
	 * @param i
	 */
	public void setReported(int i) {
		reported = i;
	}

	/**
	 * @return
	 */
	public int getSerType() {
		return serType;
	}

	/**
	 * @param i
	 */
	public void setSerType(int i) {
		serType = i;
	}

}
