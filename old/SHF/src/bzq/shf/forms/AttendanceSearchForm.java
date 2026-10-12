/*
 * Created on 04/11/2008
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
public class AttendanceSearchForm extends AttendanceDataForm{
	
	protected Date attendanceDate; 	
	protected String timeFrom;
	protected String timeTo;
	protected String moked;
	protected String[] team;
	protected String job;
	protected String[] activity;
	protected String[] innerJob;
	protected String[] workLocation;
	protected int missingSum=0;
	protected int lateSum=0;
	protected int attendSum=0;
	protected int stationSum=0;
	protected int tadreechSum=0;
	protected int inforceSum=0;
	protected int slpitSum=0;
	protected int netHoursSum=0;
	
	
	public int getInforceSum() {
		return inforceSum;
	}


	public void setInforceSum(int inforceSum) {
		this.inforceSum = inforceSum;
	}


	public int getSlpitSum() {
		return slpitSum;
	}


	public void setSlpitSum(int slpitSum) {
		this.slpitSum = slpitSum;
	}


	public int getNetHoursSum() {
		return netHoursSum;
	}


	public void setNetHoursSum(int netHoursSum) {
		this.netHoursSum = netHoursSum;
	}

	protected String branch;
	protected int eventType;
	
	
	public void reset(){
		innerJob=new String[0];
	}
	

	public String[] getInnerJob() {
		return innerJob;
	}


	public void setInnerJob(String[] innerJob) {
		this.innerJob = innerJob;
	}


	public String[] getActivity() {
		return activity;
	}


	public void setActivity(String[] activity) {
		this.activity = activity;
	}


	public AttendanceSearchForm(){
		super();
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

	

	public int getTadreechSum() {
		return tadreechSum;
	}


	public void setTadreechSum(int tadreechSum) {
		this.tadreechSum = tadreechSum;
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
	 * @return
	 */
	public String getJob() {
		return job;
	}

	/**
	 * @param i
	 */
	public void setJob(String i) {
		job = i;
	}

	/**
	 * @return
	 */
	public Date getAttendanceDate() {
		return attendanceDate;
	}

	/**
	 * @param string
	 */
	public void setAttendanceDate(Date date) {
		attendanceDate = date;
	}

	/**
	 * @return
	 */
	public String getMoked() {
		return moked;
	}

	/**
	 * @return
	 */
	public String[] getTeam() {
		return team;
	}

	/**
	 * @param i
	 */
	public void setMoked(String i) {
		moked = i;
	}

	/**
	 * @param i
	 */
	public void setTeam(String[] i) {
		team = i;
	}

	

	public String[] getWorkLocation() {
		return workLocation;
	}


	public void setWorkLocation(String[] workLocation) {
		this.workLocation = workLocation;
	}


	/**
	 * @return
	 */
	public int getAttendSum() {
		return attendSum;
	}

	/**
	 * @return
	 */
	public int getLateSum() {
		return lateSum;
	}

	/**
	 * @return
	 */
	public int getMissingSum() {
		return missingSum;
	}

	/**
	 * @param i
	 */
	public void setAttendSum(int i) {
		attendSum = i;
	}

	/**
	 * @param i
	 */
	public void setLateSum(int i) {
		lateSum = i;
	}

	/**
	 * @param i
	 */
	public void setMissingSum(int i) {
		missingSum = i;
	}

	/**
	 * @return
	 */
	public String getBranch() {
		return branch;
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
	public void setBranch(String str) {
		branch = str;
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
	public int getStationSum() {
		return stationSum;
	}

	/**
	 * @param i
	 */
	public void setStationSum(int i) {
		stationSum = i;
	}

	public void copyForm(AttendanceSearchForm other){
		this.moked=other.getMoked();
		this.attendanceDate=other.getAttendanceDate();
		this.timeFrom=other.getTimeFrom();
		this.timeTo=other.getTimeTo();
		this.team=other.getTeam();
		this.activity=other.getActivity();
		this.innerJob=other.getInnerJob();
	}

}
