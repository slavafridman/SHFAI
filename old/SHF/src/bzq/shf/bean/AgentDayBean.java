/*
 * Created on 17/11/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.bean;

import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.StringTokenizer;
import java.util.Vector;

import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.SHFUtils;
import bzq.utils.BaseConvert;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class AgentDayBean extends ShfBaseBean {
	
	protected static HashMap fieldsMapping = null;
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("EMPLOYEE_ID", "employeeId");
		fieldsMapping.put("EMP_ID_NUMBER_FULL", "employeeIdNumberFull");
		fieldsMapping.put("LAST_NAME", "lastName");
		fieldsMapping.put("FIRST_NAME", "firstName");
		fieldsMapping.put("JOB_ID", "jobCode");
		fieldsMapping.put("JOB_NAME", "jobName");
		fieldsMapping.put("CELLULAR_PHONE", "cellularPhone");
		fieldsMapping.put("HOME_PHONE", "homePhone");
		fieldsMapping.put("ORG_UNIT_ID", "orgUnitCode");
		fieldsMapping.put("SHF_LOCKED","locked");
		fieldsMapping.put("REPLACE_ALLOWED","replaceAllowed");
		fieldsMapping.put("INNER_JOB_ID","innerJobId");
		fieldsMapping.put("ORG_UNIT_NAME","orgUnitName");
		
		fieldsMapping.put("EMPLOYEE_ID_OLD","employeeId_old");
		fieldsMapping.put("LAST_NAME_OLD","lastName_old");
		fieldsMapping.put("FIRST_NAME_OLD","firstName_old");
		
		fieldsMapping.put("SHF_EMPLOYEE_DAY_ID", "agentDayId");
		fieldsMapping.put("WM_SCHEDULE_DAY_ID","wfmAgendDayId");
		fieldsMapping.put("EMP_ID_NUMBER","wmEmpIdNumber");
		fieldsMapping.put("WM_SHIFT_ID","shiftId");
		fieldsMapping.put("WM_DAY_TYPE","wmDayType");
		fieldsMapping.put("WM_SCH_ACTIVITY_ID_DATA","wmActivityId");
		fieldsMapping.put("WM_SITE_ID","wmSiteId");
		fieldsMapping.put("WM_DATE","date");
		fieldsMapping.put("WM_SHIFT_START_DATETIME","wmShiftStartTime");
		fieldsMapping.put("WM_SHIFT_END_DATETIME","wmShiftEndTime");
		fieldsMapping.put("WM_START_DATETIME","wmDayStart");
		fieldsMapping.put("WM_END_DATETIME","wmDayEnd");
		fieldsMapping.put("WM_EXCEPTION_TYPE_ID","wmExceptionId");
		fieldsMapping.put("WM_SCH_STATE_DATA","stateData");
		fieldsMapping.put("SOURCE","shiftSource");
		fieldsMapping.put("WM_TIMEOFF_TYPE_ID","wmTimeoffTypeId");
		fieldsMapping.put("WM_PAID_MINUTES","wmPaidMinutes");
		fieldsMapping.put("WM_WORK_MINUTES","wmWorkMinutes");
		fieldsMapping.put("REMARK","remark");
		fieldsMapping.put("WORK_FROM_HOME","workFromHome");
		fieldsMapping.put("SPLIT_SHIFT","splitShift");
		fieldsMapping.put("SPLIT_START","splitStart");
		fieldsMapping.put("SPLIT_END","splitEnd");
		fieldsMapping.put("POOL_EXT_NUM","poolExtNum");
		fieldsMapping.put("POOL_ERR","poolErr");
		
		
		fieldsMapping.put("NEW_ACTIVITY","newActivity");
		fieldsMapping.put("NEW_DAY_END","newDayEnd");
		fieldsMapping.put("NEW_DAY_START","newDayStart");
		fieldsMapping.put("NEW_DAY_TYPE","newDayType");
		fieldsMapping.put("NEW_EMPLOYEE_ID","newEmpIdNumber");
		fieldsMapping.put("NEW_EXCEPTION_TYPE_ID","newExceptionTypeId");
		fieldsMapping.put("NEW_PAID_MINUTES","newPaidMinutes");
		fieldsMapping.put("NEW_SHIFT_END","newShiftEnd");
		fieldsMapping.put("NEW_SHIFT_START","newShiftStart");
		fieldsMapping.put("NEW_SITE_ID","newSiteId");
		fieldsMapping.put("NEW_TIMEOFF_TYPE_ID","newTimeoffTypeId");
		fieldsMapping.put("NEW_WORK_MINUTES","newWorkMinutes");
		fieldsMapping.put("SWITCH_DAY_ID","switchDayId");
		fieldsMapping.put("MODIFICATION_TIME","modificationTime");
		fieldsMapping.put("MODIFICATION_USER","modificationUser");
		fieldsMapping.put("START_CHANGE_REASON", "startChangeReason");
		fieldsMapping.put("END_CHANGE_REASON", "endChangeReason");
		fieldsMapping.put("CANCEL_REASON_CODE", "cancelReasonCode");
		fieldsMapping.put("CANCEL_REASON_REMARK", "cancelReasonRemark");		
		fieldsMapping.put("STAGE_ARRIVAL_TIME", "stageArrivalTime");
		fieldsMapping.put("STATION_ARRIVAL_TIME", "stationArrivalTime");
		fieldsMapping.put("STAGE_ARRIVAL_USER", "stageArrivalUser");
		fieldsMapping.put("STATION_ARRIVAL_USER", "stationArrivalUser");
		fieldsMapping.put("LATE_MINUTES", "lateMinutes");
		fieldsMapping.put("LATE_REASON_ID", "lateReasonId");
		fieldsMapping.put("LATE_REMARK", "lateRemark");
		fieldsMapping.put("STAGE_LATE_MINUTES", "stageLateMinutes");
		fieldsMapping.put("STAGE_LATE_REASON_ID", "stageLateReasonId");
		fieldsMapping.put("STAGE_LATE_REMARK", "stageLateRemark");
		fieldsMapping.put("MISS_REASON_ID", "missingReasonId");
		fieldsMapping.put("MISSING_TIME", "missingTime");
		fieldsMapping.put("MISSING_REMARK", "missingRemark");
		fieldsMapping.put("STATION_EXIT_TIME","stationExitTime");
		fieldsMapping.put("STATION_EXIT_USER","stationExitUser");
		fieldsMapping.put("OPTIONAL1","flag");
		fieldsMapping.put("TADREECH","tadreech");
		fieldsMapping.put("SWITCHED_FIRST_NAME","switchedWithFirstName");
		fieldsMapping.put("SWITCHED_LAST_NAME","switchedWithLastName");
		fieldsMapping.put("SITE_NAME","siteName");
		fieldsMapping.put("NEW_WORK_FROM_HOME","newWorkFromHome");
		fieldsMapping.put("NEW_SPLIT_SHIFT","newSplitShift");
		fieldsMapping.put("NEW_SPLIT_START","newSplitStart");
		fieldsMapping.put("NEW_SPLIT_END","newSplitEnd");
		fieldsMapping.put("NEW_POOL_EXT_NUM","newPoolExtNum");
		fieldsMapping.put("NEW_POOL_ERR","newPoolErr");
		
		fieldsMapping.put("APPLIER_NAME","applierName");
		fieldsMapping.put("UPDATER_NAME","updaterName");
		fieldsMapping.put("CANCEL_LOGIN_REMARK","cancelLoginRemark");
		
		
		
	}
	
	/* (non-Javadoc)
	 * @see bzq.shf.bean.ShfBaseBean#getFieldsMapping()
	 */
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	} 
		
	protected int employeeId;
	protected String employeeIdNumberFull;
	protected String lastName;
	protected String firstName;
	protected int jobCode;
	protected String jobName;
	protected String cellularPhone;
	protected String homePhone;
	protected String orgUnitCode;
	protected int locked;
	protected int replaceAllowed;
	protected String innerJobId;
	protected String orgUnitName;

	protected int employeeId_old;
	protected String lastName_old;
	protected String firstName_old;
			
	protected long agentDayId;
	protected long wfmAgendDayId;
	protected String wmEmpIdNumber;
	protected int wmShiftId;
	protected int wmDayType;
	protected String wmActivityId;
	protected String wmSiteId;
	protected Date date;
	protected Date wmShiftStartTime;
	protected Date wmShiftEndTime;
	protected Date wmDayStart;
	protected Date wmDayEnd;
	protected int wmExceptionId;
	protected String stateData;
	protected String shiftSource;
	protected int wmTimeoffTypeId;
	protected int wmPaidMinutes;
	protected int wmWorkMinutes;
	protected String remark;
	protected String siteName;
	protected String workFromHome;
	protected String splitShift;
	protected Date splitStart;
	protected Date splitEnd;
	protected String poolExtNum;
	protected String poolErr;
	protected int poolRequestType;

	protected String newActivity;
	protected Date newDayEnd;
	protected Date newDayStart;
	protected int newDayType;
	protected String newEmpIdNumber;
	protected int newExceptionTypeId;
	protected int newPaidMinutes;
	protected Date newShiftEnd;
	protected Date newShiftStart;
	protected String newSiteId;
	protected int newTimeoffTypeId;
	protected int newWorkMinutes;
	protected long switchDayId;
	protected Date modificationTime;
	protected String modificationUser;
	protected int startChangeReason;
	protected int endChangeReason;
	protected String cancelReasonCode;
	protected String cancelReasonRemark;
	protected Date stageArrivalTime;
	protected Date stationArrivalTime;
	protected String stageArrivalUser;
	protected String stationArrivalUser;
	protected int lateMinutes;
	protected int lateReasonId;
	protected int stageLateMinutes;
	protected int stageLateReasonId;
	protected String stageLateRemark;
	protected int missingReasonId;
	protected Date missingTime;
	protected String lateRemark;
	protected String missingRemark;
	protected Date stationExitTime;
	protected String stationExitUser;
	protected String flag;
	protected int tadreech;
	protected String newWorkFromHome;
	protected String newSplitShift;
	protected Date newSplitStart;
	protected Date newSplitEnd;
	protected String newPoolExtNum;
	protected String newPoolErr;
	
	protected String applierName;
	protected String updaterName;
	protected String cancelLoginRemark;
	
	protected String virtualActivity;
	protected String switchedWithFirstName;
	protected String switchedWithLastName;	
	
	
	public String getSiteName() {
		return siteName;
	}

	public void setSiteName(String siteName) {
		this.siteName = siteName;
	}
	public String getSwitchedWithFirstName() {
		return switchedWithFirstName;
	}

	public void setSwitchedWithFirstName(String switchedWithFirstName) {
		this.switchedWithFirstName = switchedWithFirstName;
	}

	public String getSwitchedWithLastName() {
		return switchedWithLastName;
	}

	public void setSwitchedWithLastName(String switchedWithLastName) {
		this.switchedWithLastName = switchedWithLastName;
	}

	public String getCancelReasonCode() {
		return cancelReasonCode;
	}

	public void setCancelReasonCode(String cancelReasonCode) {
		this.cancelReasonCode = cancelReasonCode;
	}

	public String getCancelReasonRemark() {
		return cancelReasonRemark;
	}

	public void setCancelReasonRemark(String cancelReasonRemark) {
		this.cancelReasonRemark = cancelReasonRemark;
	}

	/**
	 * @return
	 */
	public long getAgentDayId() {
		return agentDayId;
	}

	/**
	 * @return
	 */
	public int getEmployeeId() {
		return employeeId;
	}

	public String getEmployeeIdNumberFull() {
		return employeeIdNumberFull;
	}

	public void setEmployeeIdNumberFull(String employeeIdNumber) {
		this.employeeIdNumberFull = employeeIdNumber;
	}

	/**
	 * @return
	 */
	public String getFirstName() {
		return firstName;
	}

	/**
	 * @return
	 */
	public int getJobCode() {
		return jobCode;
	}

	/**
	 * @return
	 */
	public String getLastName() {
		return lastName;
	}

	/**
	 * @return
	 */
	public int getLateMinutes() {
		return lateMinutes;
	}

	/**
	 * @return
	 */
	public int getLateReasonId() {
		return lateReasonId;
	}

	/**
	 * @return
	 */
	public String getLateRemark() {
		return lateRemark;
	}

	/**
	 * @return
	 */
	public int getMissingReasonId() {
		return missingReasonId;
	}

	/**
	 * @return
	 */
	public String getMissingRemark() {
		return missingRemark;
	}

	/**
	 * @return
	 */
	public Date getMissingTime() {
		return missingTime;
	}

	/**
	 * @return
	 */
	public Date getModificationTime() {
		return modificationTime;
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
	public Date getNewDayEnd() {
		return newDayEnd;
	}

	/**
	 * @return
	 */
	public Date getNewDayStart() {
		return newDayStart;
	}

	/**
	 * @return
	 */
	public int getNewDayType() {
		return newDayType;
	}

	/**
	 * @return
	 */
	public String getNewEmpIdNumber() {
		return newEmpIdNumber;
	}

	/**
	 * @return
	 */
	public int getNewExceptionTypeId() {
		return newExceptionTypeId;
	}

	/**
	 * @return
	 */
	public int getNewPaidMinutes() {
		return newPaidMinutes;
	}

	/**
	 * @return
	 */
	public Date getNewShiftEnd() {
		return newShiftEnd;
	}

	/**
	 * @return
	 */
	public Date getNewShiftStart() {
		return newShiftStart;
	}

	/**
	 * @return
	 */
	public String getNewSiteId() {
		return newSiteId;
	}

	/**
	 * @return
	 */
	public int getNewTimeoffTypeId() {
		return newTimeoffTypeId;
	}

	/**
	 * @return
	 */
	public int getNewWorkMinutes() {
		return newWorkMinutes;
	}

	/**
	 * @return
	 */
	public String getOrgUnitCode() {
		return orgUnitCode;
	}

	/**
	 * @return
	 */
	public String getShiftSource() {
		return shiftSource;
	}

	/**
	 * @return
	 */
	public Date getStageArrivalTime() {
		return stageArrivalTime;
	}

	/**
	 * @return
	 */
	public String getStageArrivalUser() {
		return stageArrivalUser;
	}

	/**
	 * @return
	 */
	public String getStateData() {
		return stateData;
	}

	/**
	 * @return
	 */
	public Date getStationArrivalTime() {
		return stationArrivalTime;
	}

	/**
	 * @return
	 */
	public String getStationArrivalUser() {
		return stationArrivalUser;
	}

	/**
	 * @return
	 */
	public long getSwitchDayId() {
		return switchDayId;
	}

	

	/**
	 * @return
	 */
	public long getWfmAgendDayId() {
		return wfmAgendDayId;
	}

	/**
	 * @return
	 */
	public String getWmActivityId() {
		return wmActivityId;
	}

	

	/**
	 * @return
	 */
	public Date getWmDayEnd() {
		return wmDayEnd;
	}

	/**
	 * @return
	 */
	public Date getWmDayStart() {
		return wmDayStart;
	}

	/**
	 * @return
	 */
	public int getWmDayType() {
		return wmDayType;
	}

	/**
	 * @return
	 */
	public String getWmEmpIdNumber() {
		return wmEmpIdNumber;
	}

	/**
	 * @return
	 */
	public int getWmExceptionId() {
		return wmExceptionId;
	}

	/**
	 * @return
	 */
	public int getWmPaidMinutes() {
		return wmPaidMinutes;
	}

	/**
	 * @return
	 */
	public Date getWmShiftEndTime() {
		return wmShiftEndTime;
	}

	/**
	 * @return
	 */
	public int getWmShiftId() {
		return wmShiftId;
	}

	/**
	 * @return
	 */
	public Date getWmShiftStartTime() {
		return wmShiftStartTime;
	}

	/**
	 * @return
	 */
	public String getWmSiteId() {
		return wmSiteId;
	}

	/**
	 * @return
	 */
	public int getWmTimeoffTypeId() {
		return wmTimeoffTypeId;
	}

	/**
	 * @return
	 */
	public int getWmWorkMinutes() {
		return wmWorkMinutes;
	}

	/**
	 * @param map
	 */
	public static void setFieldsMapping(HashMap map) {
		fieldsMapping = map;
	}

	/**
	 * @param l
	 */
	public void setAgentDayId(long l) {
		agentDayId = l;
	}

	/**
	 * @param i
	 */
	public void setEmployeeId(int i) {
		employeeId = i;
	}

	/**
	 * @param string
	 */
	public void setFirstName(String string) {
		firstName = string;
	}

	/**
	 * @param i
	 */
	public void setJobCode(int i) {
		jobCode = i;
	}

	public String getJobName() {
		return jobName;
	}

	public void setJobName(String jobName) {
		this.jobName = jobName;
	}

	public String getCellularPhone() {
		return cellularPhone;
	}

	public void setCellularPhone(String cellularPhone) {
		this.cellularPhone = cellularPhone;
	}

	public String getHomePhone() {
		return homePhone;
	}

	public void setHomePhone(String homePhone) {
		this.homePhone = homePhone;
	}

	/**
	 * @param string
	 */
	public void setLastName(String string) {
		lastName = string;
	}

	/**
	 * @param i
	 */
	public void setLateMinutes(int i) {
		lateMinutes = i;
	}

	/**
	 * @param i
	 */
	public void setLateReasonId(int i) {
		lateReasonId = i;
	}

	/**
	 * @param string
	 */
	public void setLateRemark(String string) {
		lateRemark = string;
	}

	/**
	 * @param i
	 */
	public void setMissingReasonId(int i) {
		missingReasonId = i;
	}

	/**
	 * @param string
	 */
	public void setMissingRemark(String string) {
		missingRemark = string;
	}

	/**
	 * @param date
	 */
	public void setMissingTime(Date date) {
		missingTime = date;
	}

	/**
	 * @param date
	 */
	public void setModificationTime(Date date) {
		modificationTime = date;
	}

	/**
	 * @param string
	 */
	public void setNewActivity(String string) {
		newActivity = string;
	}

	/**
	 * @param date
	 */
	public void setNewDayEnd(Date date) {
		newDayEnd = date;
	}

	/**
	 * @param date
	 */
	public void setNewDayStart(Date date) {
		newDayStart = date;
	}

	/**
	 * @param i
	 */
	public void setNewDayType(int i) {
		newDayType = i;
	}

	/**
	 * @param string
	 */
	public void setNewEmpIdNumber(String string) {
		newEmpIdNumber = string;
	}

	/**
	 * @param i
	 */
	public void setNewExceptionTypeId(int i) {
		newExceptionTypeId = i;
	}

	/**
	 * @param i
	 */
	public void setNewPaidMinutes(int i) {
		newPaidMinutes = i;
	}

	/**
	 * @param date
	 */
	public void setNewShiftEnd(Date date) {
		newShiftEnd = date;
	}

	/**
	 * @param date
	 */
	public void setNewShiftStart(Date date) {
		newShiftStart = date;
	}

	/**
	 * @param i
	 */
	public void setNewSiteId(String i) {
		newSiteId = i;
	}

	/**
	 * @param i
	 */
	public void setNewTimeoffTypeId(int i) {
		newTimeoffTypeId = i;
	}

	/**
	 * @param i
	 */
	public void setNewWorkMinutes(int i) {
		newWorkMinutes = i;
	}

	/**
	 * @param i
	 */
	public void setOrgUnitCode(String i) {
		orgUnitCode = i;
	}

	/**
	 * @param string
	 */
	public void setShiftSource(String string) {
		shiftSource = string;
	}

	/**
	 * @param date
	 */
	public void setStageArrivalTime(Date date) {
		stageArrivalTime = date;
	}

	/**
	 * @param string
	 */
	public void setStageArrivalUser(String string) {
		stageArrivalUser = string;
	}

	/**
	 * @param string
	 */
	public void setStateData(String string) {
		stateData = string;
	}

	/**
	 * @param date
	 */
	public void setStationArrivalTime(Date date) {
		stationArrivalTime = date;
	}

	/**
	 * @param string
	 */
	public void setStationArrivalUser(String string) {
		stationArrivalUser = string;
	}

	/**
	 * @param l
	 */
	public void setSwitchDayId(long l) {
		switchDayId = l;
	}

	

	/**
	 * @param l
	 */
	public void setWfmAgendDayId(long l) {
		wfmAgendDayId = l;
	}

	/**
	 * @param string
	 */
	public void setWmActivityId(String string) {
		wmActivityId = string;
	}

	

	/**
	 * @param date
	 */
	public void setWmDayEnd(Date date) {
		wmDayEnd = date;
	}

	/**
	 * @param date
	 */
	public void setWmDayStart(Date date) {
		wmDayStart = date;
	}

	/**
	 * @param i
	 */
	public void setWmDayType(int i) {
		wmDayType = i;
	}

	/**
	 * @param string
	 */
	public void setWmEmpIdNumber(String string) {
		wmEmpIdNumber = string;
	}

	/**
	 * @param i
	 */
	public void setWmExceptionId(int i) {
		wmExceptionId = i;
	}

	/**
	 * @param i
	 */
	public void setWmPaidMinutes(int i) {
		wmPaidMinutes = i;
	}

	/**
	 * @param date
	 */
	public void setWmShiftEndTime(Date date) {
		wmShiftEndTime = date;
	}

	/**
	 * @param i
	 */
	public void setWmShiftId(int i) {
		wmShiftId = i;
	}

	/**
	 * @param date
	 */
	public void setWmShiftStartTime(Date date) {
		wmShiftStartTime = date;
	}

	/**
	 * @param i
	 */
	public void setWmSiteId(String i) {
		wmSiteId = i;
	}

	/**
	 * @param i
	 */
	public void setWmTimeoffTypeId(int i) {
		wmTimeoffTypeId = i;
	}

	/**
	 * @param i
	 */
	public void setWmWorkMinutes(int i) {
		wmWorkMinutes = i;
	}

	/**
	 * @return
	 */
	public String getShiftActivity() {
		return newActivity==null?wmActivityId:newActivity;
	}

	/**
	 * @return
	 */
	public Date getDayEnd() {
		return newDayEnd==null?wmDayEnd:newDayEnd;
	}

	/**
	 * @return
	 */
	public Date getDayStart() {
		return newDayStart==null?wmDayStart:newDayStart;
	}

	/**
	 * @return
	 */
	public int getDayType() {
		return newDayType<=0?wmDayType:newDayType;
	}

	/**
	 * @return
	 */
	public String getEmpIdNumber() {
		return newEmpIdNumber==null?wmEmpIdNumber:newEmpIdNumber;
	}

	/**
	 * @return
	 */
	public int getExceptionTypeId() {
		return wmExceptionId;
	}

	/**
	 * @return
	 */
	public int getPaidMinutes() {
		return newPaidMinutes>0?newPaidMinutes:wmPaidMinutes;
	}

	/**
	 * @return
	 */
	public Date getShiftEnd() {
		return newShiftEnd==null?wmShiftEndTime:newShiftEnd;
	}

	/**
	 * @return
	 */
	public Date getShiftStart() {
		return newShiftStart==null?wmShiftStartTime:newShiftStart;
	}

	/**
	 * @return
	 */
	public String getSiteId() {
		return newSiteId==null?wmSiteId:newSiteId;
	}

	/**
	 * @return
	 */
	public int getTimeoffTypeId() {
		return newTimeoffTypeId<=0?wmTimeoffTypeId:newTimeoffTypeId;
	}

	/**
	 * @return
	 */
	public int getWorkMinutes() {
		return newWorkMinutes<=0?wmWorkMinutes:newWorkMinutes;
	}


	/**
	 * @return
	 */
	public Date getDate() {
		return newShiftStart==null?date:newShiftStart;
	}

	/**
	 * @param date
	 */
	public void setDate(Date date) {
		this.date = date;
	}

	/**
	 * @return
	 */
	public String getModificationUser() {
		return modificationUser;
	}

	/**
	 * @param string
	 */
	public void setModificationUser(String string) {
		modificationUser = string;
	}

	/**
	 * @return
	 */
	public Date getStationExitTime() {
		return stationExitTime;
	}

	/**
	 * @return
	 */
	public String getStationExitUser() {
		return stationExitUser;
	}

	/**
	 * @param date
	 */
	public void setStationExitTime(Date date) {
		stationExitTime = date;
	}

	/**
	 * @param string
	 */
	public void setStationExitUser(String string) {
		stationExitUser = string;
	}

	/**
	 * @return
	 */
	public int getEndChangeReason() {
		return endChangeReason;
	}

	/**
	 * @return
	 */
	public int getStartChangeReason() {
		return startChangeReason;
	}

	/**
	 * @param i
	 */
	public void setEndChangeReason(int i) {
		endChangeReason = i;
	}

	/**
	 * @param i
	 */
	public void setStartChangeReason(int i) {
		startChangeReason = i;
	}
	
	public boolean isLate(){
		if(getShiftStart()!=null && getShiftStart().after(new Date()))
			return true;
		return false;
	}
	

	/**
	 * @return
	 */
	public int getStageLateMinutes() {
		return stageLateMinutes;
	}

	/**
	 * @return
	 */
	public int getStageLateReasonId() {
		return stageLateReasonId;
	}

	/**
	 * @return
	 */
	public String getStageLateRemark() {
		return stageLateRemark;
	}

	/**
	 * @param i
	 */
	public void setStageLateMinutes(int i) {
		stageLateMinutes = i;
	}

	/**
	 * @param i
	 */
	public void setStageLateReasonId(int i) {
		stageLateReasonId = i;
	}

	/**
	 * @param string
	 */
	public void setStageLateRemark(String string) {
		stageLateRemark = string;
	}

	/**
	 * @return
	 */
	public int getLocked() {
		return locked;
	}

	/**
	 * @param i
	 */
	public void setLocked(int i) {
		locked = i;
	}
	
	/**
	 * return true if the shift is night shift
	 * @ return true if the shift start between 23:00-07:00 (7 not included)
	 */
	public boolean isNeightShift(){
		Calendar cal=Calendar.getInstance();
		cal.setTime(getShiftStart());
		int hour=cal.get(Calendar.HOUR_OF_DAY);
		return hour<7 || hour==23;
//		return true;
		
	}
	
	/*
	public Vector getExceptions(){
		Vector vec=null;
		if(stateData!=null && stateData.length()>0){
			vec=new Vector();
			StringTokenizer st=new StringTokenizer(stateData,"\n");
			while(st.hasMoreTokens()){
				String token=st.nextToken();
				token=token.trim();
				if(!token.startsWith(String.valueOf(SHFConstants.STATE_EXCEPTION)))
					continue;
				StringTokenizer stmp=new StringTokenizer(token,";");
				String daytype=stmp.nextToken();
				String activity=stmp.nextToken();
				int minutesStart=Integer.parseInt(stmp.nextToken());
				int minutesEnd=Integer.parseInt(stmp.nextToken());
			
				AgentDayBean day=new AgentDayBean();
				copyAgentDay(day);
				day.setWmDayType(SHFConstants.DAY_TYPE_EXCEPTION);
				Date start=day.getShiftStart();
				Calendar cal=Calendar.getInstance();
				cal.setTime(start);
				cal.set(Calendar.HOUR_OF_DAY,0);
				cal.set(Calendar.MINUTE,0);
				cal.set(Calendar.SECOND,0);
				cal.set(Calendar.MILLISECOND,0);
				cal.add(Calendar.MINUTE,minutesStart);
				day.setWmShiftStartTime(cal.getTime());
				cal.add(Calendar.MINUTE,minutesEnd-minutesStart);
				day.setWmShiftEndTime(cal.getTime());
				day.setWmActivityId(activity);
				vec.add(day);
			}
		}
		return vec;
	}
*/
	
	
	
	/**
	 * @return
	 */
	public String getFlag() {
		return flag;
	}

	/**
	 * @param string
	 */
	public void setFlag(String string) {
		flag = string;
	}

	/**
	 * @return
	 */
	public int getReplaceAllowed() {
		return replaceAllowed;
	}

	/**
	 * @param i
	 */
	public void setReplaceAllowed(int i) {
		replaceAllowed = i;
	}

	/**
	 * @return
	 */
	public int getEmployeeId_old() {
		return employeeId_old;
	}

	/**
	 * @return
	 */
	public String getFirstName_old() {
		return firstName_old;
	}

	/**
	 * @return
	 */
	public String getLastName_old() {
		return lastName_old;
	}

	/**
	 * @param i
	 */
	public void setEmployeeId_old(int i) {
		employeeId_old = i;
	}

	
	
	public int getTadreech() {
		return tadreech;
	}

	public void setTadreech(int tadreech) {
		this.tadreech = tadreech;
	}

	/**
	 * @param string
	 */
	public void setFirstName_old(String string) {
		firstName_old = string;
	}

	/**
	 * @param string
	 */
	public void setLastName_old(String string) {
		lastName_old = string;
	}
	
	public boolean isSameTime(AgentDayBean day){
		if(day==null) return false;
		return getShiftStart().equals(day.getShiftStart()) && getShiftEnd().equals(day.getShiftEnd());
	}

	public String getRemark() {
		return remark;
	}

	public void setRemark(String remark) {
		this.remark = remark;
	}

	public String getInnerJobId() {
		return innerJobId;
	}

	public void setInnerJobId(String innerJobId) {
		this.innerJobId = innerJobId;
	}
	
	public String getOrgUnitName() {
		return orgUnitName;
	}

	public String getMokedCode() {
		return SHFTableUtils.getMokedCodeOf(orgUnitCode);
	}
	
	public void setOrgUnitName(String orgUnitName) {
		this.orgUnitName = orgUnitName;
	}

	public String getFullName(){
		return firstName+" "+lastName;
	}
	
	public int getShiftLengthChange(){
		int oldlen=SHFUtils.getMinutesBetween(wmShiftStartTime,wmShiftEndTime);
		int newlen=SHFUtils.getMinutesBetween(getShiftStart(),getShiftEnd());
		return newlen-oldlen;
	}


	public String getApplierName() {
		return applierName;
	}

	public void setApplierName(String applierName) {
		this.applierName = applierName;
	}

	public String getUpdaterName() {
		return updaterName;
	}

	public void setUpdaterName(String updaterName) {
		this.updaterName = updaterName;
	}

	public String getCancelLoginRemark() {
		return cancelLoginRemark;
	}

	public void setCancelLoginRemark(String cancelLoginRemark) {
		this.cancelLoginRemark = cancelLoginRemark;
	}

	public String getVirtualActivity() {
		return virtualActivity;
	}

	public void setVirtualActivity(String virtualActivity) {
		this.virtualActivity = virtualActivity;
	}

	public String getWorkFromHome() {
		return workFromHome;
	}

	public void setWorkFromHome(String workFromHome) {
		this.workFromHome = workFromHome;
	}

	public String getNewWorkFromHome() {
		return newWorkFromHome;
	}

	public void setNewWorkFromHome(String newWorkFromHome) {
		this.newWorkFromHome = newWorkFromHome;
	}

	public boolean isWorkingFromHome() {
		return this.newWorkFromHome != null ? (this.newWorkFromHome.equalsIgnoreCase("y") ? true : false) : (this.workFromHome.equalsIgnoreCase("y") ? true : false);
	}
	
	public boolean isShiftSplit() {
		if (newSplitShift != null) 
			return "y".equalsIgnoreCase(this.newSplitShift) ? true : false;
		else		
			return this.splitShift != null ? ("y".equalsIgnoreCase(this.splitShift) ? true : false) : false;
	}
	
	public Date getSplitShiftStart() {
		return newSplitStart == null ? this.splitStart : newSplitStart;
	}
	
	public Date getSplitShiftEnd() {
		return newSplitEnd == null ? this.splitEnd : newSplitEnd;
	}
	
	public int getSplitShiftLength() {
		int length = getSplitShiftLengthPart(1) + getSplitShiftLengthPart(2);
		return length;
	}
	
	public int getSplitShiftLengthPart(int part) {
		int length = 0;
			if (1 == part) {
				length = SHFUtils.getMinutesBetween(getShiftStart(), getSplitShiftStart());
			} else if (2 == part){
				length = SHFUtils.getMinutesBetween(getSplitShiftEnd(), getShiftEnd());
			}
		return length;
	}
	
	public double getSplitShiftDurationHours() {
		double duration = 0;
		if(isShiftSplit()){
			duration = getSplitShiftLength() / 60.0;
		} 
		return duration;
	}
	
	public int getSplitDuration() {
		return SHFUtils.getMinutesBetween(getSplitShiftStart(), getSplitShiftEnd());
	}

	public String getSplitShift() {
		return splitShift;
	}
	
	public void setSplitShift(String splitShift) {
		this.splitShift = splitShift;
	}

	public Date getSplitStart() {
		return splitStart;
	}

	public void setSplitStart(Date splitStart) {
		this.splitStart = splitStart;
	}

	public Date getSplitEnd() {
		return splitEnd;
	}

	public void setSplitEnd(Date splitEnd) {
		this.splitEnd = splitEnd;
	}
	
	public String getShiftExtNum(){
//		return newShiftStart == null ? getPoolExtNum() :  getNewPoolExtNum();
		return getNewPoolExtNum() != null ? getNewPoolExtNum() : newShiftStart == null ? getPoolExtNum() :  getNewPoolExtNum();
	}
	
	public String getShiftExtErr(){
//		return getNewPoolErr() != null ? getNewPoolErr() : getPoolErr();
		return getNewPoolErr() != null ? getNewPoolErr() : newShiftStart == null ? getPoolErr() :  getNewPoolErr();
	}

	public String getPoolExtNum() {
		return poolExtNum;
	}

	public void setPoolExtNum(String poolExtNum) {
		this.poolExtNum = poolExtNum;
	}

	public String getPoolErr() {
		return poolErr;
	}

	public void setPoolErr(String poolErr) {
		this.poolErr = poolErr;
	}

	public String getNewPoolExtNum() {
		return newPoolExtNum;
	}

	public void setNewPoolExtNum(String newPoolExtNum) {
		this.newPoolExtNum = newPoolExtNum;
	}

	public String getNewPoolErr() {
		return newPoolErr;
	}

	public void setNewPoolErr(String newPoolErr) {
		this.newPoolErr = newPoolErr;
	}

	public String getNewSplitShift() {
		return newSplitShift;
	}

	public void setNewSplitShift(String newSplitShift) {
		this.newSplitShift = newSplitShift;
	}

	public Date getNewSplitStart() {
		return newSplitStart;
	}

	public void setNewSplitStart(Date newSplitStart) {
		this.newSplitStart = newSplitStart;
	}

	public Date getNewSplitEnd() {
		return newSplitEnd;
	}

	public void setNewSplitEnd(Date newSplitEnd) {
		this.newSplitEnd = newSplitEnd;
	}

	public int getPoolRequestType() {
		return poolRequestType;
	}

	public void setPoolRequestType(int poolRequestType) {
		this.poolRequestType = poolRequestType;
	}


	
}
