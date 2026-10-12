/*
 * Created on 01/02/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.transfer;

import java.util.Date;
import java.util.HashMap;

import bzq.shf.bean.ShfBaseBean;

/**
 * @author 03445956
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ReplaceByCritrionOldNew extends ShfBaseBean{
	
private int employeeDayId;
private Date startTime;
private Date endTime;
private String activity;
private String employeePerId;
private String employeeId;
private String newEmployeeId;
private String fullname;	
private Date newStartTime;
private Date newEndTime;
private String newActivity;
private String newEmployeePerId;
private String newFullname;

	protected static HashMap fieldsMapping = null;
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("SHF_EMPLOYEE_DAY_ID", "employeeDayId");
		fieldsMapping.put("STARTTIME", "startTime");
		fieldsMapping.put("ENDTIME", "endTime");
		fieldsMapping.put("ACTIVITY", "activity");
		fieldsMapping.put("EMPLOYEE_ID","employeeId");
		fieldsMapping.put("EMP_ID_NUMBER","employeePerId");
		fieldsMapping.put("FULLNAME","fullname");		
		fieldsMapping.put("NEWSTARTTIME","newStartTime");
		fieldsMapping.put("NEWENDTIME","newEndTime");
		fieldsMapping.put("NEWACTIVITY","newActivity");
		fieldsMapping.put("NEW_EMPLOYEE_ID","newEmployeeId");
		fieldsMapping.put("NEWEMPID","newEmployeePerId");
		fieldsMapping.put("NEWFULLNAME","newFullname");
	}
	/* (non-Javadoc)
	 * @see bzq.shf.bean.ShfBaseBean#getFieldsMapping()
	 */
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}

/**
 * @return
 */
public String getActivity() {
	return activity;
}

/**
 * @return
 */
public int getEmployeeDayId() {
	return employeeDayId;
}

/**
 * @return
 */
public String getEmployeePerId() {
	return employeePerId;
}

/**
 * @return
 */
public Date getEndTime() {
	return endTime;
}

/**
 * @return
 */
public String getFullname() {
	return fullname;
}

/**
 * @return
 */
public String getNewActivity() {
	return newActivity;
}

/**
 * @return
 */
public String getNewEmployeePerId() {
	return newEmployeePerId;
}

/**
 * @return
 */
public Date getNewEndTime() {
	return newEndTime;
}

/**
 * @return
 */
public String getNewFullname() {
	return newFullname;
}

/**
 * @return
 */
public Date getNewStartTime() {
	return newStartTime;
}

/**
 * @return
 */
public Date getStartTime() {
	return startTime;
}

/**
 * @param string
 */
public void setActivity(String string) {
	activity = string;
}

/**
 * @param i
 */
public void setEmployeeDayId(int i) {
	employeeDayId = i;
}

/**
 * @param string
 */
public void setEmployeePerId(String string) {
	employeePerId = string;
}

/**
 * @param date
 */
public void setEndTime(Date date) {
	endTime = date;
}

/**
 * @param string
 */
public void setFullname(String string) {
	fullname = string;
}

/**
 * @param string
 */
public void setNewActivity(String string) {
	newActivity = string;
}

/**
 * @param string
 */
public void setNewEmployeePerId(String string) {
	newEmployeePerId = string;
}

/**
 * @param date
 */
public void setNewEndTime(Date date) {
	newEndTime = date;
}

/**
 * @param string
 */
public void setNewFullname(String string) {
	newFullname = string;
}

/**
 * @param date
 */
public void setNewStartTime(Date date) {
	newStartTime = date;
}

/**
 * @param date
 */
public void setStartTime(Date date) {
	startTime = date;
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
public String getNewEmployeeId() {
	return newEmployeeId;
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
public void setNewEmployeeId(String string) {
	newEmployeeId = string;
}

}
