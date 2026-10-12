/*
 * Created on 17/11/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

import java.util.Vector;


/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class EmployeeArriveForm extends AttendanceSearchForm{

	//private String source;
	private String missDateStart;
	private String missDateEnd;
	private int attendanceValue;
	private int tadreech;
	protected String lateSource;
	protected Vector breaks;
	protected Vector approveManager;
	protected int agentMood;
	public EmployeeArriveForm(){
		super();
	}


	public int getAgentMood() {
		return agentMood;
	}

	public void setAgentMood(int agentMood) {
		this.agentMood = agentMood;
	}



	public int getTadreech() {
		return tadreech;
	}


	public void setTadreech(int tadreech) {
		this.tadreech = tadreech;
	}


	/**
	 * @return
	 */
	public int getAttendanceValue() {
		return attendanceValue;
	}

	/**
	 * @param i
	 */
	public void setAttendanceValue(int i) {
		attendanceValue = i;
	}


	/**
	 * @return
	 */
	public String getLateSource() {
		return lateSource;
	}

	/**
	 * @param string
	 */
	public void setLateSource(String string) {
		lateSource = string;
	}

	/**
	 * @return
	 */
	public Vector getBreaks() {
		return breaks;
	}

	/**
	 * @param vector
	 */
	public void setBreaks(Vector vector) {
		breaks = vector;
	}

	
	/**
	 * @return
	 */
	public Vector getApproveManager() {
		return approveManager;
	}

	/**
	 * @param vector
	 */
	public void setApproveManager(Vector vector) {
		approveManager = vector;
	}



	/**
	 * @return
	 */
	public String getMissDateEnd() {
		return missDateEnd;
	}

	/**
	 * @return
	 */
	public String getMissDateStart() {
		return missDateStart;
	}

	/**
	 * @param string
	 */
	public void setMissDateEnd(String string) {
		missDateEnd = string;
	}

	/**
	 * @param string
	 */
	public void setMissDateStart(String string) {
		missDateStart = string;
	}

}
