/*
 * Created on 19/01/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;


/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class EventReasonForm extends TableForm{
	
	static {
		fieldsMapping.put("BRANCH_ID", "branch");
		fieldsMapping.put("REPORTED", "reported");
		fieldsMapping.put("REPORT_REQUESTED","reportRequested");
		fieldsMapping.put("SER_TYPE","type");
	}

	private int branch;
	private int reported;
	private int reportRequested;
	private int type;
	/**
	 * @return
	 */
	public int getBranch() {
		return branch;
	}

	/**
	 * @return
	 */
	public int getReported() {
		return reported;
	}

	/**
	 * @return
	 */
	public int getReportRequested() {
		return reportRequested;
	}

	/**
	 * @return
	 */
	public int getType() {
		return type;
	}

	/**
	 * @param i
	 */
	public void setBranch(int i) {
		branch = i;
	}

	/**
	 * @param i
	 */
	public void setReported(int i) {
		reported = i;
	}

	/**
	 * @param i
	 */
	public void setReportRequested(int i) {
		reportRequested = i;
	}

	/**
	 * @param i
	 */
	public void setType(int i) {
		type = i;
	}

}
