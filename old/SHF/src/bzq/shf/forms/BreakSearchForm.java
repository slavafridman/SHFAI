/*
 * Created on 12/03/2009
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
public class BreakSearchForm extends ShfBaseBean{
	protected long breakAgentDayId;
	protected Date date;
	protected String time;
	protected String to_time;
	protected String refhreshed_time;	
	protected String moked;
	protected String[] teamCode;
	protected String[] activity;
	protected String[] shiftLocation;
	protected String[] innerJob;
	
	protected String firstName;
	protected String lastName;
	protected String actionType;
	protected Vector breakVecCurrent = null;
	protected Vector breakVecExceptional = null;
//	protected Vector futureBreak = null;
//	protected Vector inBreak = null;
//	protected Vector inBreakNotReturned = null;
//	protected Vector notGoToBreak = null;
//	protected Vector endedOkBreak = null;
//	protected Vector endedNotOkBreak = null;
	protected HashMap allTab;
	public BreakSearchForm(){
		
	}
	
	public HashMap getFieldsMapping() {
		return null;
	}

	public String[] getInnerJob() {
		return innerJob;
	}

	public void setInnerJob(String[] innerJob) {
		this.innerJob = innerJob;
	}

	/**
	 * @return
	 */
	public String[] getActivity() {
		return activity;
	}

	public HashMap getAllTab() {
		return allTab;
	}

	public void setAllTab(HashMap allTab) {
		this.allTab = allTab;
	}

//	public Vector getFutureBreak() {
//		return futureBreak;
//	}
//
//	public void setFutureBreak(Vector futureBreak) {
//		this.futureBreak = futureBreak;
//	}
//
//	public Vector getInBreak() {
//		return inBreak;
//	}
//
//	public void setInBreak(Vector inBreak) {
//		this.inBreak = inBreak;
//	}
//
//	public Vector getInBreakNotReturned() {
//		return inBreakNotReturned;
//	}
//
//	public void setInBreakNotReturned(Vector inBreakNotReturned) {
//		this.inBreakNotReturned = inBreakNotReturned;
//	}
//
//	public Vector getNotGoToBreak() {
//		return notGoToBreak;
//	}
//
//	public void setNotGoToBreak(Vector notGoToBreak) {
//		this.notGoToBreak = notGoToBreak;
//	}
//
//	public Vector getEndedOkBreak() {
//		return endedOkBreak;
//	}
//
//	public void setEndedOkBreak(Vector endedOkBreak) {
//		this.endedOkBreak = endedOkBreak;
//	}
//
//	public Vector getEndedNotOkBreak() {
//		return endedNotOkBreak;
//	}
//
//	public void setEndedNotOkBreak(Vector endedNotOkBreak) {
//		this.endedNotOkBreak = endedNotOkBreak;
//	}

	public String getTo_time() {
		return to_time;
	}

	public void setTo_time(String to_time) {
		this.to_time = to_time;
	}

	public String getRefhreshed_time() {
		return refhreshed_time;
	}

	public void setRefhreshed_time(String refhreshed_time) {
		this.refhreshed_time = refhreshed_time;
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
	public String getLastName() {
		return lastName;
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
	public String[] getTeamCode() {
		return teamCode;
	}

	/**
	 * @return
	 */
	public String getTime() {
		return time;
	}

	/**
	 * @param string
	 */
	public void setActivity(String[] string) {
		activity = string;
	}

	/**
	 * @param string
	 */
	public void setFirstName(String string) {
		firstName = string;
	}

	/**
	 * @param string
	 */
	public void setLastName(String string) {
		lastName = string;
	}

	/**
	 * @param string
	 */
	public void setMoked(String string) {
		moked = string;
	}

	/**
	 * @param string
	 */
	public void setTeamCode(String[] teams) {
		teamCode = teams;
	}

	/**
	 * @param string
	 */
	public void setTime(String string) {
		time = string;
	}

	/**
	 * @return
	 */
	public Date getDate() {
		return date;
	}

	/**
	 * @param string
	 */
	public void setDate(Date a) {
		date = a;
	}

	
	/**
	 * @return
	 */
	public Vector getBreakVecCurrent() {
		return breakVecCurrent;
	}

	
	/**
	 * @param vector
	 */
	public void setBreakVecCurrent(Vector vector) {
		breakVecCurrent = vector;
	}


	/**
	 * @return
	 */
	public long getBreakAgentDayId() {
		return breakAgentDayId;
	}

	/**
	 * @param l
	 */
	public void setBreakAgentDayId(long l) {
		breakAgentDayId = l;
	}


	/**
	 * @return
	 */
	public String getActionType() {
		return actionType;
	}

	/**
	 * @param string
	 */
	public void setActionType(String string) {
		actionType = string;
	}

	/**
	 * @return
	 */
	public Vector getBreakVecExceptional() {
		return breakVecExceptional;
	}

	/**
	 * @param vector
	 */
	public void setBreakVecExceptional(Vector vector) {
		breakVecExceptional = vector;
	}



	public String[] getShiftLocation() {
		return shiftLocation;
	}

	public void setShiftLocation(String[] shiftLocation) {
		this.shiftLocation = shiftLocation;
	}

	public void copyForm(BreakSearchForm other) {
		this.date=other.getDate();
		this.time=other.getTime();
		this.to_time=other.getTo_time();
		//this.refhreshed_time=other.getRefhreshed_time();	
		this.moked=other.getMoked();
		this.teamCode=other.getTeamCode();
		this.activity=other.getActivity();
		this.firstName=other.getFirstName();
		this.lastName=other.getLastName();
		this.innerJob=other.getInnerJob();
	}

}
