/*
 * Created on 15/03/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

import java.util.Date;
import java.util.HashMap;
import java.util.Vector;

import bzq.shf.bean.ShfBaseBean;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ForecastForm extends ShfBaseBean{
	
	protected Date date;
	protected String[] virtualActivity;
	protected String activity;
	protected String timeFrom;
	protected String timeTo;
	protected String moked;
	protected boolean allday;
	protected String rbChoice;
	protected String[] activityList;
	protected String[] innerJobList;
	protected String[] exceptionList;
	protected String activitiesForSelect;
	protected String exceptionsForSelect;
	protected boolean withCalc;
	protected boolean withReq;
	protected boolean withNeto;
	protected boolean withBreak;
	protected boolean withNetoBreak;
	protected boolean withException;
	protected boolean withSum;
	protected boolean withWfm;
	protected boolean rbWithoutSign;
	//tamar-14.07.11
	protected int sumForecastCallsNum;
	protected int sumCallsNum;
	protected float sumForecastCallLength;
	protected float sumCallLength;
	protected String[] sumMokedCallLengthList;
	protected String sumForecastCallLengthTime;
	protected String sumCallLengthTime;
	protected int sumCallVal;
	protected String sumGapTime;
	protected int indexForSearch; 
	protected boolean withChange;
	//protected float sumgapFromForecast;
	//tamar-14.07.11
	
	protected String team;
	protected String department;
	
	// Igal 5.2013
	protected String from;
	public String getFrom() {
		return from;
	}
	public void setFrom(String from) {
		this.from = from;
	}
	protected String[] localActArr; // all local activities in checkbox (when site selected) in calls forecast form 
		
	public String[] getLocalActArr() {
		return localActArr;
	}
	public void setLocalActArr(String[] localActArr) {
		this.localActArr = localActArr;
	}
	//Igal 5.2013
	
	public String[] getInnerJobList() {
		return innerJobList;
	}

	public void setInnerJobList(String[] innerJobList) {
		this.innerJobList = innerJobList;
	}

	public ForecastForm(){
		super();
	}
	
	public HashMap getFieldsMapping() {
		return null;
	}
	
	public String[] getActivityList() {
		return activityList;
	}

	public String getActivitiesForSelect() {
		return activitiesForSelect;
	}

	public void setActivitiesForSelect(String activitiesForSelect) {
		this.activitiesForSelect = activitiesForSelect;
	}

	public String getExceptionsForSelect() {
		return exceptionsForSelect;
	}

	public void setExceptionsForSelect(String exceptionsForSelect) {
		this.exceptionsForSelect = exceptionsForSelect;
	}

	public void setActivityList(String[] activityList) {
		this.activityList = activityList;
	}

	public String[] getExceptionList() {
		return exceptionList;
	}

	public void setExceptionList(String[] exceptionList) {
		this.exceptionList = exceptionList;
	}

	public String getRbChoice() {
		return rbChoice;
	}

	public void setRbChoice(String rbChoice) {
		this.rbChoice = rbChoice;
	}

	public String getMoked() {
		return moked;
	}

	public void setMoked(String moked) {
		this.moked = moked;
	}

	
	/**
	 * @return
	 */
	public boolean isAllday() {
		return allday;
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
	public String getTimeFrom() {
		return timeFrom;
	}

	/**
	 * @return
	 */
	public String getTimeTo() {
		return timeTo;
	}

	/**
	 * @return
	 */
	
	/**
	 * @param b
	 */
	public void setAllday(boolean b) {
		allday = b;
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
	public void setTimeFrom(String string) {
		timeFrom = string;
	}

	/**
	 * @param string
	 */
	public void setTimeTo(String string) {
		timeTo = string;
	}

	/**
	 * @param string
	 */
	

	/**
	 * @return
	 */
	public String getActivity() {
		return activity;
	}
	public void setActivity(String string) {
		activity = string;
	}


	public String[] getVirtualActivity() {
		return virtualActivity;
	}

	public void setVirtualActivity(String[] virtualActivity) {
		this.virtualActivity = virtualActivity;
	}

	public boolean isWithCalc() {
		return withCalc;
	}

	public void setWithCalc(boolean withCalc) {
		this.withCalc = withCalc;
	}

	public boolean isWithReq() {
		return withReq;
	}

	public void setWithReq(boolean withReq) {
		this.withReq = withReq;
	}

	public boolean isWithNeto() {
		return withNeto;
	}

	public void setWithNeto(boolean withNeto) {
		this.withNeto = withNeto;
	}

	public boolean isWithBreak() {
		return withBreak;
	}

	public void setWithBreak(boolean withBreak) {
		this.withBreak = withBreak;
	}

	public boolean isWithNetoBreak() {
		return withNetoBreak;
	}

	public void setWithNetoBreak(boolean withNetoBreak) {
		this.withNetoBreak = withNetoBreak;
	}

	public boolean isWithException() {
		return withException;
	}

	public void setWithException(boolean withException) {
		this.withException = withException;
	}

	public boolean isWithSum() {
		return withSum;
	}

	public void setWithSum(boolean withSum) {
		this.withSum = withSum;
	}

	public boolean isWithWfm() {
		return withWfm;
	}

	public void setWithWfm(boolean withWfm) {
		this.withWfm = withWfm;
	}

	public boolean isRbWithoutSign() {
		rbWithoutSign = withCalc || withReq || withNeto || withBreak || withNetoBreak || withException || withSum;
		return rbWithoutSign;
	}

	public void setRbWithoutSign(boolean rbWithoutSign) {
		this.rbWithoutSign = rbWithoutSign;
	}

	
	
	
	
	public int getSumForecastCallsNum() {
		return sumForecastCallsNum;
	}

	public void setSumForecastCallsNum(int sumForecastCallsNum) {
		this.sumForecastCallsNum = sumForecastCallsNum;
	}
	
	
	
	

	public int getSumCallsNum() {
		return sumCallsNum;
	}

	public void setSumCallsNum(int sumCallsNum) {
		this.sumCallsNum = sumCallsNum;
	}

	public float getSumForecastCallLength() {
		return sumForecastCallLength;
	}

	public void setSumForecastCallLength(float sumForecastCallLength) {
		this.sumForecastCallLength = sumForecastCallLength;
	}

	public float getSumCallLength() {
		return sumCallLength;
	}

	public void setSumCallLength(float sumCallLength) {
		this.sumCallLength = sumCallLength;
	}

	public String getSumGapTime() {
		return sumGapTime;
	}

	public void setSumGapTime(String sumGapTime) {
		this.sumGapTime = sumGapTime;
	}
	

	public int getSumCallVal() {
		return sumCallVal;
	}

	public void setSumCallVal(int sumCallVal) {
		this.sumCallVal = sumCallVal;
	}

	
	public String getSumForecastCallLengthTime() {
		return sumForecastCallLengthTime;
	}

	public void setSumForecastCallLengthTime(String sumForecastCallLengthTime) {
		this.sumForecastCallLengthTime = sumForecastCallLengthTime;
	}

	public String getSumCallLengthTime() {
		return sumCallLengthTime;
	}

	public void setSumCallLengthTime(String sumCallLengthTime) {
		this.sumCallLengthTime = sumCallLengthTime;
	}
	

	


	public String[] getSumMokedCallLengthList() {
		return sumMokedCallLengthList;
	}

	public void setSumMokedCallLengthList(String[] sumMokedCallLengthList) {
		this.sumMokedCallLengthList = sumMokedCallLengthList;
	}

	
	public int getIndexForSearch() {
		return indexForSearch;
	}

	public void setIndexForSearch(int indexForSearch) {
		this.indexForSearch = indexForSearch;
	}
	

	public boolean isWithChange() {
		return withChange;
	}

	public void setWithChange(boolean withChange) {
		this.withChange = withChange;
	}

	public void copyForm(ForecastForm storedForm) {
		this.activityList = storedForm.getActivityList();
		this.allday = storedForm.isAllday();
		this.date = storedForm.getDate();
		this.timeFrom = storedForm.getTimeFrom();
		this.timeTo = storedForm.getTimeTo();
		this.rbChoice = storedForm.getRbChoice();
		this.virtualActivity = storedForm.getVirtualActivity();
		this.moked = storedForm.getMoked();
		this.activityList = storedForm.getActivityList();
		this.exceptionList = storedForm.getExceptionList();
		this.withWfm = storedForm.isWithWfm();
		this.withCalc = storedForm.isWithCalc();
		this.withReq = storedForm.isWithReq();
		this.withNeto = storedForm.isWithNeto();
		this.withBreak = storedForm.isWithBreak();
		this.withNetoBreak = storedForm.isWithNetoBreak();
		this.withException = storedForm.isWithException();
		this.withSum = storedForm.isWithSum();
		
	}

	public String getTeam() {
		return team;
	}

	public void setTeam(String team) {
		this.team = team;
	}

	public String getDepartment() {
		return department;
	}

	public void setDepartment(String department) {
		this.department = department;
	}

	
	
	/**
	 * @param string
	 */
	
}
