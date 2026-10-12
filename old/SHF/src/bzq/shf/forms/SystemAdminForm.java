/*
 * Created on 19/01/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

import java.util.HashMap;

import bzq.shf.bean.ShfBaseBean;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class SystemAdminForm extends ShfBaseBean{

	private String moked;
	private String agaf;
	private String minutesBeforeLate;
	private boolean lockEmployees;
	private String lockMissingNum;
	private String minHoursBetweenShifts;
	private String minHoursBeforeSwitch;
	private String minHoursBeforeSwitchBreak;
	private String minimalShiftDuration;
	private String minimalBreakLate;
	private String minimalBreakShifting;
	private String maxMinutesToExitAfterEnd;
	private String maxDifferenceForSwitch;
	private String minBeforeReduceRequest;
	private String minBeforeChangeRequest;
	private String minimalShiftDurationForCR;
	private String maximalShiftDurationForCR;
	private String maxToExitBeforEndShift;
	private String minTimeFromNextShift;
	private String minTimeFromLastShift;
	private String maxSelectForSwitchOffer;
	private boolean agafSendSwitchOfferSMS;
	private String managedBreakMinTimeBeforeChange;
	private boolean managedBreakEnabled;
	private boolean poolEnabled;
	private String poolTimeBeforeShiftStart;
	private String poolTimeNoArrival;
	private String poolTimeAfterShiftEnd;
	private String iwdMinAfterShiftStart;
	private String iwdMinBeforeShiftEnd;
	private String iwdDefaultTimeToComplete;
	private boolean iwdRescheduleOnAgentBreak;

	public String getAgaf() {
		return agaf;
	}



	public void setAgaf(String agaf) {
		this.agaf = agaf;
	}



	public HashMap getFieldsMapping() {
		return null;
	}

	
	
	public String getMinimalBreakShifting() {
		return minimalBreakShifting;
	}



	public void setMinimalBreakShifting(String minimalBreakShifting) {
		this.minimalBreakShifting = minimalBreakShifting;
	}



	/**
	 * @return
	 */
	public String getLockMissingNum() {
		return lockMissingNum;
	}

	/**
	 * @return
	 */
	public String getMinutesBeforeLate() {
		return minutesBeforeLate;
	}

	

	/**
	 * @param string
	 */
	public void setLockMissingNum(String string) {
		lockMissingNum = string;
	}

	/**
	 * @param string
	 */
	public void setMinutesBeforeLate(String string) {
		minutesBeforeLate = string;
	}

	/**
	 * @return
	 */
	public String getMoked() {
		return moked;
	}

	/**
	 * @param string
	 */
	public void setMoked(String string) {
		moked = string;
	}

	/**
	 * @return
	 */
	public boolean isLockEmployees() {
		return lockEmployees;
	}

	/**
	 * @param b
	 */
	public void setLockEmployees(boolean b) {
		lockEmployees = b;
	}

	/**
	 * @return
	 */
	public String getMinHoursBeforeSwitch() {
		return minHoursBeforeSwitch;
	}

	/**
	 * @return
	 */
	public String getMinHoursBetweenShifts() {
		return minHoursBetweenShifts;
	}

	/**
	 * @param string
	 */
	public void setMinHoursBeforeSwitch(String string) {
		minHoursBeforeSwitch = string;
	}

	/**
	 * @param string
	 */
	public void setMinHoursBetweenShifts(String string) {
		minHoursBetweenShifts = string;
	}

	/**
	 * @return
	 */
	public String getMinimalShiftDuration() {
		return minimalShiftDuration;
	}

	/**
	 * @param string
	 */
	public void setMinimalShiftDuration(String string) {
		minimalShiftDuration = string;
	}

	/**
	 * @return
	 */
	public String getMinimalBreakLate() {
		return minimalBreakLate;
	}

	/**
	 * @param string
	 */
	public void setMinimalBreakLate(String string) {
		minimalBreakLate = string;
	}

	/**
	 * @return
	 */
	public String getMaxMinutesToExitAfterEnd() {
		return maxMinutesToExitAfterEnd;
	}

	/**
	 * @param string
	 */
	public void setMaxMinutesToExitAfterEnd(String string) {
		maxMinutesToExitAfterEnd = string;
	}

	/**
	 * @return
	 */
	public String getMaxDifferenceForSwitch() {
		return maxDifferenceForSwitch;
	}

	/**
	 * @param string
	 */
	public void setMaxDifferenceForSwitch(String string) {
		maxDifferenceForSwitch = string;
	}

	/**
	 * @return
	 */
	public String getMinHoursBeforeSwitchBreak() {
		return minHoursBeforeSwitchBreak;
	}

	/**
	 * @param string
	 */
	public void setMinHoursBeforeSwitchBreak(String string) {
		minHoursBeforeSwitchBreak = string;
	}

	/**
	 * @return
	 */
	public String getMinBeforeChangeRequest() {
		return minBeforeChangeRequest;
	}

	/**
	 * @return
	 */
	public String getMinBeforeReduceRequest() {
		return minBeforeReduceRequest;
	}

	/**
	 * @param string
	 */
	public void setMinBeforeChangeRequest(String string) {
		minBeforeChangeRequest = string;
	}

	/**
	 * @param string
	 */
	public void setMinBeforeReduceRequest(String string) {
		minBeforeReduceRequest = string;
	}

	/**
	 * @return
	 */
	public String getMaximalShiftDurationForCR() {
		return maximalShiftDurationForCR;
	}

	/**
	 * @return
	 */
	public String getMinimalShiftDurationForCR() {
		return minimalShiftDurationForCR;
	}

	/**
	 * @param string
	 */
	public void setMaximalShiftDurationForCR(String string) {
		maximalShiftDurationForCR = string;
	}

	/**
	 * @param string
	 */
	public void setMinimalShiftDurationForCR(String string) {
		minimalShiftDurationForCR = string;
	}

	/**
	 * @return
	 */
	public String getMaxToExitBeforEndShift() {
		return maxToExitBeforEndShift;
	}

	/**
	 * @param string
	 */
	public void setMaxToExitBeforEndShift(String string) {
		maxToExitBeforEndShift = string;
	}


	public String getMinTimeFromNextShift() {
		return minTimeFromNextShift;
	}


	public void setMinTimeFromNextShift(String minTimeFromNextShift) {
		this.minTimeFromNextShift = minTimeFromNextShift;
	}


	public String getMinTimeFromLastShift() {
		return minTimeFromLastShift;
	}


	public void setMinTimeFromLastShift(String minTimeFromLastShift) {
		this.minTimeFromLastShift = minTimeFromLastShift;
	}


	public void setMaxSelectForSwitchOffer(String maxSelectForSwitchOffer) {
		this.maxSelectForSwitchOffer = maxSelectForSwitchOffer;
	}


	public String getMaxSelectForSwitchOffer() {
		return maxSelectForSwitchOffer;
	}


	public boolean isAgafSendSwitchOfferSMS() {
		return agafSendSwitchOfferSMS;
	}


	public void setAgafSendSwitchOfferSMS(boolean agafSendSwitchOfferSMS) {
		this.agafSendSwitchOfferSMS = agafSendSwitchOfferSMS;
	}


	public String getManagedBreakMinTimeBeforeChange() {
		return managedBreakMinTimeBeforeChange;
	}


	public void setManagedBreakMinTimeBeforeChange(
			String managedBreakMinTimeBeforeChange) {
		this.managedBreakMinTimeBeforeChange = managedBreakMinTimeBeforeChange;
	}


	public boolean isPoolEnabled() {
		return poolEnabled;
	}



	public void setPoolEnabled(boolean poolEnabled) {
		this.poolEnabled = poolEnabled;
	}

	public String getPoolTimeBeforeShiftStart() {
		return poolTimeBeforeShiftStart;
	}



	public void setPoolTimeBeforeShiftStart(String poolTimeBeforeShiftStart) {
		this.poolTimeBeforeShiftStart = poolTimeBeforeShiftStart;
	}



	public String getPoolTimeNoArrival() {
		return poolTimeNoArrival;
	}



	public void setPoolTimeNoArrival(String poolTimeNoArrival) {
		this.poolTimeNoArrival = poolTimeNoArrival;
	}



	public String getPoolTimeAfterShiftEnd() {
		return poolTimeAfterShiftEnd;
	}



	public void setPoolTimeAfterShiftEnd(String poolTimeAfterShiftEnd) {
		this.poolTimeAfterShiftEnd = poolTimeAfterShiftEnd;
	}



	public boolean isManagedBreakEnabled() {
		return managedBreakEnabled;
	}


	public void setManagedBreakEnabled(boolean managedBreakEnabled) {
		this.managedBreakEnabled = managedBreakEnabled;
	}



	public String getIwdMinAfterShiftStart() {
		return iwdMinAfterShiftStart;
	}



	public void setIwdMinAfterShiftStart(String iwdMinAfterShiftStart) {
		this.iwdMinAfterShiftStart = iwdMinAfterShiftStart;
	}



	public String getIwdMinBeforeShiftEnd() {
		return iwdMinBeforeShiftEnd;
	}



	public void setIwdMinBeforeShiftEnd(String iwdMinBeforeShiftEnd) {
		this.iwdMinBeforeShiftEnd = iwdMinBeforeShiftEnd;
	}



	public String getIwdDefaultTimeToComplete() {
		return iwdDefaultTimeToComplete;
	}



	public void setIwdDefaultTimeToComplete(String iwdDefaultTimeToComplete) {
		this.iwdDefaultTimeToComplete = iwdDefaultTimeToComplete;
	}



	public boolean isIwdRescheduleOnAgentBreak() {
		return iwdRescheduleOnAgentBreak;
	}



	public void setIwdRescheduleOnAgentBreak(boolean iwdRescheduleOnAgentBreak) {
		this.iwdRescheduleOnAgentBreak = iwdRescheduleOnAgentBreak;
	}


}
