/*
 * Created on 23/03/2009
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
public class ExceptionBean extends ShfBaseBean{

	protected static HashMap fieldsMapping = null;
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("AGENT_DAY_ID","agentDayId");
		fieldsMapping.put("STATE_TYPE","stateType");
		fieldsMapping.put("EXCEPTION_TYPE","exceptionType");
		fieldsMapping.put("START_TIME","startTime");
		fieldsMapping.put("END_TIME","endTime");
		fieldsMapping.put("DURATION","duration");
		fieldsMapping.put("EXIT_TIME","exitTime");
		fieldsMapping.put("ENTRY_TIME","entryTime");
		fieldsMapping.put("SOURCE","source");
		fieldsMapping.put("MODIFICATION_TIME","modificationTime");
		fieldsMapping.put("MODIFICATION_USER","modificationUser");
		fieldsMapping.put("CANCEL_REASON_CODE","cancelReasonCode");
		fieldsMapping.put("CANCEL_REASON_REMARK","cancelRemark");
		fieldsMapping.put("REMARK","remark");
		fieldsMapping.put("WM_SCH_ACTIVITY_ID_DATA","wmActivityId");
		fieldsMapping.put("EXCEPTION_TYPE_NAME","exceptionName");
	}
	
	protected long agentDayId;
	protected int stateType;
	protected String exceptionType;
	protected Date startTime;
	protected Date endTime;
	protected int duration;
	protected Date exitTime;
	protected Date entryTime;
	protected String source;
	protected String remark;
	protected Date modificationTime;
	protected String modificationUser;
	protected String cancelReasonCode;
	protected String cancelRemark;
	//Svetlana
	protected String wmActivityId;
	//Igal
	protected String exceptionName;

	public String getExceptionName() {
		return exceptionName;
	}

	public void setExceptionName(String exceptionName) {
		this.exceptionName = exceptionName;
	}

	public String getWmActivityId() {
		return wmActivityId;
	}

	public void setWmActivityId(String wmActivityId) {
		this.wmActivityId = wmActivityId;
	}

	public Date getModificationTime() {
		return modificationTime;
	}

	public void setModificationTime(Date modificationTime) {
		this.modificationTime = modificationTime;
	}

	public String getModificationUser() {
		return modificationUser;
	}

	public void setModificationUser(String modificationUser) {
		this.modificationUser = modificationUser;
	}

	

	public String getCancelReasonCode() {
		return cancelReasonCode;
	}

	public void setCancelReasonCode(String cancelReasonCode) {
		this.cancelReasonCode = cancelReasonCode;
	}

	public String getCancelRemark() {
		return cancelRemark;
	}

	public void setCancelRemark(String cancelReasonRemark) {
		this.cancelRemark = cancelReasonRemark;
	}

	public String getRemark() {
		return remark;
	}

	public void setRemark(String remark) {
		this.remark = remark;
	}

	public HashMap getFieldsMapping() {
		return fieldsMapping;
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
	public int getDuration() {
		return duration;
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
	public Date getEntryTime() {
		return entryTime;
	}

	/**
	 * @return
	 */
	public String getExceptionType() {
		return exceptionType;
	}

	/**
	 * @return
	 */
	public Date getExitTime() {
		return exitTime;
	}

	/**
	 * @return
	 */
	public String getSource() {
		return source;
	}

	/**
	 * @return
	 */
	public Date getStartTime() {
		return startTime;
	}

	/**
	 * @return
	 */
	public int getStateType() {
		return stateType;
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
	public void setDuration(int i) {
		duration = i;
	}

	/**
	 * @param date
	 */
	public void setEndTime(Date date) {
		endTime = date;
	}

	/**
	 * @param date
	 */
	public void setEntryTime(Date date) {
		entryTime = date;
	}

	/**
	 * @param i
	 */
	public void setExceptionType(String i) {
		exceptionType = i;
	}

	/**
	 * @param date
	 */
	public void setExitTime(Date date) {
		exitTime = date;
	}

	/**
	 * @param string
	 */
	public void setSource(String string) {
		source = string;
	}

	/**
	 * @param date
	 */
	public void setStartTime(Date date) {
		startTime = date;
	}

	/**
	 * @param i
	 */
	public void setStateType(int i) {
		stateType = i;
	}

	/* (non-Javadoc)
	 * @see bzq.shf.bean.ShfBaseBean#getFieldsMapping()
	 */


}
