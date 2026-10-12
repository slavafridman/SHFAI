/*
 * Created on 05/10/2008
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
public class EmployeeListForm extends EmployeeDataForm {
	
	protected String first_name;
	protected String last_name;
	protected String id_number;
	protected String moked;
	protected String job;
	protected int status;
	protected String[] team;
	protected String[] innerJob;
	
	public EmployeeListForm(){
		super();
	}
	

	/**
	 * @return
	 */
	public String getFirst_name() {
		return first_name;
	}

	/**
	 * @return
	 */
	public String getId_number() {
		return id_number;
	}

	/**
	 * @return
	 */
	public String getJob() {
		return job;
	}

	/**
	 * @return
	 */
	public String getLast_name() {
		return last_name;
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
	public int getStatus() {
		return status;
	}

	/**
	 * @return
	 */
	public String[] getTeam() {
		return team;
	}

	/**
	 * @param string
	 */
	public void setFirst_name(String string) {
		first_name = string;
	}

	/**
	 * @param string
	 */
	public void setId_number(String string) {
		id_number = string;
	}

	/**
	 * @param i
	 */
	public void setJob(String str) {
		job = str;
	}

	/**
	 * @param string
	 */
	public void setLast_name(String string) {
		last_name = string;
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
	public void setStatus(int i) {
		status = i;
	}

	/**
	 * @param i
	 */
	public void setTeam(String[] i) {
		team = i;
	}


	public String[] getInnerJob() {
		return innerJob;
	}


	public void setInnerJob(String[] innerJob) {
		this.innerJob = innerJob;
	}

	public void copyForm(EmployeeListForm other){
		this.first_name=other.getFirst_name();
		this.last_name=other.getLast_name();
		this.id_number=other.getId_number();
		this.moked=other.getMoked();
		this.team=other.getTeam();
		this.innerJob=other.getInnerJob();
		this.job=other.getJob();
		this.status=other.getStatus();
		this.optional1=other.getOptional1();
	}
	
	
}
