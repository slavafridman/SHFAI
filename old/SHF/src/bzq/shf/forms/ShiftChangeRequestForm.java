/*
 * Created on 13/07/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

import java.util.Date;
import java.util.HashMap;
import java.util.Vector;

import bzq.shf.bean.ChangeRequestCandidate;
import bzq.shf.bean.ShfBaseBean;
import bzq.utils.BaseConvert;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ShiftChangeRequestForm extends ShfBaseBean{
	
	protected static HashMap fieldsMapping= null;
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("CHANGE_REQUEST_ID" , "requestId");
		fieldsMapping.put("ORG_UNIT_ID" , "moked");
		fieldsMapping.put("ACTIVITY" , "activity");
		fieldsMapping.put("REQUEST_DATE" , "date");
		fieldsMapping.put("AGENTS_NUMBER" , "agentsNum");
		fieldsMapping.put("AUTO_APPROVE" , "autoApprove");
		fieldsMapping.put("SHIFT_START_FROM" , "startFromDate");
		fieldsMapping.put("SHIFT_START_TO" , "startToDate");
		fieldsMapping.put("SHIFT_END_FROM" , "endFromDate");
		fieldsMapping.put("SHIFT_END_TO" , "endToDate");
		fieldsMapping.put("SHIFT_LENGTH" , "shiftLength");
		fieldsMapping.put("SHIFT_START_OPTION" , "shiftStartOption");
		fieldsMapping.put("SHIFT_END_OPTION" , "shiftEndOption");
		fieldsMapping.put("SHIFT_LENGTH_OPTION" , "shiftLengthOption");
		fieldsMapping.put("CHANGE_START_SELECTED" , "changeStartSelected");
		fieldsMapping.put("CHANGE_END_SELECTED" , "changeEndSelected");
		fieldsMapping.put("CHANGE_START_OPTION" , "changeStartOption");
		fieldsMapping.put("CHANGE_END_OPTION" , "changeEndOption");
		fieldsMapping.put("NEW_START" , "newStartTimeDate");
		fieldsMapping.put("NEW_END" , "newEndTimeDate");
		fieldsMapping.put("EXTRA_MINUTES_START" , "newExtraMinutesAtStart");
		fieldsMapping.put("EXTRA_MINUTES_END" , "newExtraMinutesAtEnd");
		fieldsMapping.put("LESS_MINUTES_START" , "newLessMinutesAtStart");
		fieldsMapping.put("LESS_MINUTES_END" , "newLessMinutesAtEnd");
		fieldsMapping.put("CREATED_BY" , "createdBy");
		fieldsMapping.put("CREATED_AT" , "creationTime");
		fieldsMapping.put("MODIFIED_BY" , "modifiedBy");
		fieldsMapping.put("MODIFIED_AT" , "modificationTime");
		fieldsMapping.put("APPROVED_NUM","aprovedNum");
		
				
	}
	
	
	protected long requestId;
	protected String moked;
	protected String activity;
	//protected String date;
	protected Date date;
	protected int agentsNum;
	protected int autoApprove;
	
	protected String startFrom;
	protected String startTo;
	protected String endFrom;
	protected String endTo;
	
	protected Date startFromDate;
	protected Date startToDate;
	protected Date endFromDate;
	protected Date endToDate;
		
	protected int shiftLength;
	protected int shiftStartOption;
	protected int shiftEndOption;
	protected int shiftLengthOption;
	
	
	protected int changeStartSelected;
	protected int changeEndSelected;
	protected String changeStartOption;
	protected String changeEndOption;
	
	protected String newStartTime;
	protected String newEndTime;
	protected Date newStartTimeDate;
	protected Date newEndTimeDate;
	
	protected int newExtraMinutesAtStart;
	protected int newExtraMinutesAtEnd;
	protected int newLessMinutesAtStart;
	protected int newLessMinutesAtEnd;
	
	protected String createdBy;
	protected Date creationTime;
	protected String modifiedBy;
	protected Date modificationTime;
	
	protected Vector agentDaysApplications;
	protected ChangeRequestCandidate candidate;
	protected int aprovedNum;	
	
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}

	public ShiftChangeRequestForm(){
		
	}
	public ShiftChangeRequestForm(long id){
		this.requestId=id;
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
	public int getAgentsNum() {
		return agentsNum;
	}

	/**
	 * @return
	 */
	/*public String getDate() {
		if(dateDate!=null) return BaseConvert.dateToString(dateDate,"dd/MM/yyyy");
		return date;
	}*/

	/**
	 * @return
	 */
	public String getMoked() {
		return moked;
	}

	/**
	 * @return
	 */
	public int getShiftLength() {
		return shiftLength;
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
	public void setAgentsNum(int i) {
		agentsNum = i;
	}

	/**
	 * @param string
	 */
	/*public void setDate(String string) {
		date = string;
	}*/

	/**
	 * @param string
	 */
	public void setMoked(String string) {
		moked = string;
	}

	/**
	 * @param i
	 */
	public void setShiftLength(int i) {
		shiftLength = i;
	}

	/**
	 * @return
	 */
	public String getEndFrom() {
		if(endFromDate!=null) return BaseConvert.dateToString(endFromDate,"HH:mm");
		return endFrom;
	}

	/**
	 * @return
	 */
	public String getEndTo() {
		if(endToDate!=null) return BaseConvert.dateToString(endToDate,"HH:mm");
		return endTo;
	}

	

	/**
	 * @return
	 */
	public String getStartFrom() {
		if(startFromDate!=null) return BaseConvert.dateToString(startFromDate,"HH:mm");
		return startFrom;
	}

	/**
	 * @return
	 */
	public String getStartTo() {
		if(startToDate!=null) return BaseConvert.dateToString(startToDate,"HH:mm");
		return startTo;
	}

	/**
	 * @param string
	 */
	public void setEndFrom(String string) {
		endFrom = string;
	}

	/**
	 * @param string
	 */
	public void setEndTo(String string) {
		endTo = string;
	}

	/**
	 * @param string
	 */
	public void setStartFrom(String string) {
		startFrom = string;
	}

	/**
	 * @param string
	 */
	public void setStartTo(String string) {
		startTo = string;
	}

	/**
	 * @return
	 */
	public String getChangeEndOption() {
		return changeEndOption;
	}


	/**
	 * @return
	 */
	public String getChangeStartOption() {
		return changeStartOption;
	}

	/**
	 * @return
	 */
	public String getNewEndTime() {
		if(newEndTimeDate!=null) return BaseConvert.dateToString(newEndTimeDate,"HH:mm");
		return newEndTime;
	}

	/**
	 * @return
	 */
	public int getNewExtraMinutesAtEnd() {
		return newExtraMinutesAtEnd;
	}

	/**
	 * @return
	 */
	public int getNewExtraMinutesAtStart() {
		return newExtraMinutesAtStart;
	}

	/**
	 * @return
	 */
	public int getNewLessMinutesAtEnd() {
		return newLessMinutesAtEnd;
	}

	/**
	 * @return
	 */
	public int getNewLessMinutesAtStart() {
		return newLessMinutesAtStart;
	}

	/**
	 * @return
	 */
	public String getNewStartTime() {
		if(newStartTimeDate!=null) return BaseConvert.dateToString(newStartTimeDate,"HH:mm");
		return newStartTime;
	}

	/**
	 * @param string
	 */
	public void setChangeEndOption(String string) {
		changeEndOption = string;
	}

	/**
	 * @param string
	 */
	public void setChangeStartOption(String string) {
		changeStartOption = string;
	}

	/**
	 * @param string
	 */
	public void setNewEndTime(String string) {
		newEndTime = string;
	}

	/**
	 * @param i
	 */
	public void setNewExtraMinutesAtEnd(int i) {
		newExtraMinutesAtEnd = i;
	}

	/**
	 * @param i
	 */
	public void setNewExtraMinutesAtStart(int i) {
		newExtraMinutesAtStart = i;
	}

	/**
	 * @param i
	 */
	public void setNewLessMinutesAtEnd(int i) {
		newLessMinutesAtEnd = i;
	}

	/**
	 * @param i
	 */
	public void setNewLessMinutesAtStart(int i) {
		newLessMinutesAtStart = i;
	}

	/**
	 * @param string
	 */
	public void setNewStartTime(String string) {
		newStartTime = string;
	}

	/**
	 * @return
	 */
	public String getCreatedBy() {
		return createdBy;
	}

	/**
	 * @return
	 */
	public Date getCreationTime() {
		return creationTime;
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
	public String getModifiedBy() {
		return modifiedBy;
	}

	/**
	 * @return
	 */
	public long getRequestId() {
		return requestId;
	}

	/**
	 * @param map
	 */
	public static void setFieldsMapping(HashMap map) {
		fieldsMapping = map;
	}


	/**
	 * @param string
	 */
	public void setCreatedBy(String string) {
		createdBy = string;
	}

	/**
	 * @param date
	 */
	public void setCreationTime(Date date) {
		creationTime = date;
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
	public void setModifiedBy(String string) {
		modifiedBy = string;
	}

	/**
	 * @param l
	 */
	public void setRequestId(long l) {
		requestId = l;
	}

	/**
	 * @return
	 */
	public Date getEndFromDate() {
		return endFromDate;
	}

	/**
	 * @return
	 */
	public Date getEndToDate() {
		return endToDate;
	}

	/**
	 * @return
	 */
	public Date getNewEndTimeDate() {
		return newEndTimeDate;
	}

	/**
	 * @return
	 */
	public Date getNewStartTimeDate() {
		return newStartTimeDate;
	}

	/**
	 * @return
	 */
	public Date getStartFromDate() {
		return startFromDate;
	}

	/**
	 * @return
	 */
	public Date getStartToDate() {
		return startToDate;
	}

	/**
	 * @param date
	 */
	public void setEndFromDate(Date date) {
		endFromDate = date;
	}

	/**
	 * @param date
	 */
	public void setEndToDate(Date date) {
		endToDate = date;
	}

	/**
	 * @param date
	 */
	public void setNewEndTimeDate(Date date) {
		newEndTimeDate = date;
	}

	/**
	 * @param date
	 */
	public void setNewStartTimeDate(Date date) {
		newStartTimeDate = date;
	}

	/**
	 * @param date
	 */
	public void setStartFromDate(Date date) {
		startFromDate = date;
	}

	/**
	 * @param date
	 */
	public void setStartToDate(Date date) {
		startToDate = date;
	}

	/**
	 * @return
	 */
	public Date getDate() {
		return date;
	}

	/**
	 * @param date
	 */
	public void setDate(Date d) {
		date = d;
	}
	
	
	/**
	 * @return
	 */
	public int getChangeEndSelected() {
		return changeEndSelected;
	}

	/**
	 * @return
	 */
	public int getChangeStartSelected() {
		return changeStartSelected;
	}

	/**
	 * @return
	 */
	public int getShiftEndOption() {
		return shiftEndOption;
	}

	/**
	 * @return
	 */
	public int getShiftLengthOption() {
		return shiftLengthOption;
	}

	/**
	 * @return
	 */
	public int getShiftStartOption() {
		return shiftStartOption;
	}

	/**
	 * @param i
	 */
	public void setChangeEndSelected(int i) {
		changeEndSelected = i;
	}

	/**
	 * @param i
	 */
	public void setChangeStartSelected(int i) {
		changeStartSelected = i;
	}

	/**
	 * @param i
	 */
	public void setShiftEndOption(int i) {
		shiftEndOption = i;
	}

	/**
	 * @param i
	 */
	public void setShiftLengthOption(int i) {
		shiftLengthOption = i;
	}

	/**
	 * @param i
	 */
	public void setShiftStartOption(int i) {
		shiftStartOption = i;
	}

	

	/**
	 * @return
	 */
	public int getAutoApprove() {
		return autoApprove;
	}

	/**
	 * @param i
	 */
	public void setAutoApprove(int i) {
		autoApprove = i;
	}
	
	public String getStartChangeDesc(){
		if(changeStartOption.equals("newStartTime"))
			return "שעת התחלה חדשה";
		else if(changeStartOption.equals("newExtraMinutesAtStart"))
			return "הארכה בדקות בתחילת משמרת";
		else if(changeStartOption.equals("newLessMinutesAtStart"))
			return "קיצור בדקות בתחילת משמרת";
		return "";
	}
	
	public String getEndChangeDesc(){
		if(changeEndOption.equals("newEndTime"))
			return "שעת סיום חדשה";
		else if(changeEndOption.equals("newExtraMinutesAtEnd"))
			return "הארכה בדקות בסיום משמרת";
		else if(changeEndOption.equals("newLessMinutesAtEnd"))
			return "קיצור בדקות בסיום משמרת";
		return "";
	}
	

	/**
	 * @return
	 */
	public Vector getAgentDaysApplications() {
		return agentDaysApplications;
	}

	/**
	 * @param vector
	 */
	public void setAgentDaysApplications(Vector vector) {
		agentDaysApplications = vector;
	}

	

	/**
	 * @return
	 */
	public ChangeRequestCandidate getCandidate() {
		return candidate;
	}

	/**
	 * @param candidate
	 */
	public void setCandidate(ChangeRequestCandidate candidate) {
		this.candidate = candidate;
	}
		
	
	/**
	 * @return
	 */
	public int getAprovedNum() {
		return aprovedNum;
	}

	/**
	 * @param i
	 */
	public void setAprovedNum(int i) {
		aprovedNum = i;
	}

}
