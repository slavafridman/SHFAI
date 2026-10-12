/*
 * Created on 23/04/2009
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
public class ShiftBreakForm extends ShiftDataForm{
	
	private long agentDayId;
	//private String ShiftDate;
	private int breaksNumber;
	private String firstBreakTime;
	private String secondBreakTime;
	private String thirdBreakTime;
	private String firstBreakTimeOld;
	private String secondBreakTimeOld;
	private String thirdBreakTimeOld;
	private int firstBreakLength;
	private int secondBreakLength;
	private int thirdBreakLength;
	private int firstBreakLengthOld;
	private int secondBreakLengthOld;
	private int thirdBreakLengthOld;
	private int firstBreakStarted;
	private int secondBreakStarted;
	private int thirdBreakStarted;
	private int firstBreakEnded;
	private int secondBreakEnded;
	private int thirdBreakEnded;
	private String originalShiftStart;
	private String originalShiftEnd;
	protected Date dateEnd;
	protected Date firstBreakStartDateTime;
	protected Date secondBreakStartDateTime;
	protected Date thirdBreakStartDateTime;
	
	
	public ShiftBreakForm(){
		
	}
	

	public int getFirstBreakStarted() {
		return firstBreakStarted;
	}


	public void setFirstBreakStarted(int firstBreakStarted) {
		this.firstBreakStarted = firstBreakStarted;
	}


	public int getSecondBreakStarted() {
		return secondBreakStarted;
	}


	public void setSecondBreakStarted(int secondBreakStarted) {
		this.secondBreakStarted = secondBreakStarted;
	}


	public int getThirdBreakStarted() {
		return thirdBreakStarted;
	}



	public void setThirdBreakStarted(int thirdBreakStarted) {
		this.thirdBreakStarted = thirdBreakStarted;
	}


	public void setFirstBreakEnded(int firstBreakEnded) {
		this.firstBreakEnded = firstBreakEnded;
	}


	public int getFirstBreakEnded() {
		return firstBreakEnded;
	}


	public void setSecondBreakEnded(int secondBreakEnded) {
		this.secondBreakEnded = secondBreakEnded;
	}


	public int getSecondBreakEnded() {
		return secondBreakEnded;
	}


	public void setThirdBreakEnded(int thirdBreakEnded) {
		this.thirdBreakEnded = thirdBreakEnded;
	}


	public int getThirdBreakEnded() {
		return thirdBreakEnded;
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
	public int getBreaksNumber() {
		return breaksNumber;
	}

	/**
	 * @return
	 */
	public int getFirstBreakLength() {
		return firstBreakLength;
	}

	/**
	 * @return
	 */
	public String getFirstBreakTime() {
		return firstBreakTime;
	}

	/**
	 * @return
	 */
	public int getSecondBreakLength() {
		return secondBreakLength;
	}

	/**
	 * @return
	 */
	public String getSecondBreakTime() {
		return secondBreakTime;
	}

	/**
	 * @return
	 */
	public int getThirdBreakLength() {
		return thirdBreakLength;
	}

	/**
	 * @return
	 */
	public String getThirdBreakTime() {
		return thirdBreakTime;
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
	public void setBreaksNumber(int i) {
		breaksNumber = i;
	}

	/**
	 * @param i
	 */
	public void setFirstBreakLength(int i) {
		firstBreakLength = i;
	}

	/**
	 * @param string
	 */
	public void setFirstBreakTime(String string) {
		firstBreakTime = string;
	}

	/**
	 * @param i
	 */
	public void setSecondBreakLength(int i) {
		secondBreakLength = i;
	}

	/**
	 * @param string
	 */
	public void setSecondBreakTime(String string) {
		secondBreakTime = string;
	}

	/**
	 * @param i
	 */
	public void setThirdBreakLength(int i) {
		thirdBreakLength = i;
	}

	/**
	 * @param string
	 */
	public void setThirdBreakTime(String string) {
		thirdBreakTime = string;
	}

	

	/**
	 * @return
	 */
	public String getOriginalShiftEnd() {
		return originalShiftEnd;
	}

	/**
	 * @return
	 */
	public String getOriginalShiftStart() {
		return originalShiftStart;
	}

	/**
	 * @param date
	 */

	/**
	 * @param string
	 */
	public void setOriginalShiftEnd(String string) {
		originalShiftEnd = string;
	}

	/**
	 * @param string
	 */
	public void setOriginalShiftStart(String string) {
		originalShiftStart = string;
	}


	public String getFirstBreakTimeOld() {
		return firstBreakTimeOld;
	}


	public void setFirstBreakTimeOld(String firstBreakTimeOld) {
		this.firstBreakTimeOld = firstBreakTimeOld;
	}


	public String getSecondBreakTimeOld() {
		return secondBreakTimeOld;
	}


	public void setSecondBreakTimeOld(String secondBreakTimeOld) {
		this.secondBreakTimeOld = secondBreakTimeOld;
	}


	public String getThirdBreakTimeOld() {
		return thirdBreakTimeOld;
	}


	public void setThirdBreakTimeOld(String thirdBreakTimeOld) {
		this.thirdBreakTimeOld = thirdBreakTimeOld;
	}


	public int getFirstBreakLengthOld() {
		return firstBreakLengthOld;
	}


	public void setFirstBreakLengthOld(int firstBreakLengthOld) {
		this.firstBreakLengthOld = firstBreakLengthOld;
	}


	public int getSecondBreakLengthOld() {
		return secondBreakLengthOld;
	}


	public void setSecondBreakLengthOld(int secondBreakLengthOld) {
		this.secondBreakLengthOld = secondBreakLengthOld;
	}


	public int getThirdBreakLengthOld() {
		return thirdBreakLengthOld;
	}


	public void setThirdBreakLengthOld(int thirdBreakLengthOld) {
		this.thirdBreakLengthOld = thirdBreakLengthOld;
	}


	public Date getDateEnd() {
		return dateEnd;
	}


	public void setDateEnd(Date dateEnd) {
		this.dateEnd = dateEnd;
	}


	public Date getFirstBreakStartDateTime() {
		return firstBreakStartDateTime;
	}


	public void setFirstBreakStartDateTime(Date firstBreakStartDateTime) {
		this.firstBreakStartDateTime = firstBreakStartDateTime;
	}


	public Date getSecondBreakStartDateTime() {
		return secondBreakStartDateTime;
	}


	public void setSecondBreakStartDateTime(Date secindBreakStartDateTime) {
		this.secondBreakStartDateTime = secindBreakStartDateTime;
	}


	public Date getThirdBreakStartDateTime() {
		return thirdBreakStartDateTime;
	}


	public void setThirdBreakStartDateTime(Date thirdBreakStartDateTime) {
		this.thirdBreakStartDateTime = thirdBreakStartDateTime;
	}

}
