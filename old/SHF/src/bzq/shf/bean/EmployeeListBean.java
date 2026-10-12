/*
 * Created on 05/10/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.bean;

import java.util.HashMap;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class EmployeeListBean extends ShfBaseBean{

	protected int moked=0;
	protected int team=0;
	protected int status=0;
	protected int job=0;
	
	public EmployeeListBean(){
		
	}
	
	/* (non-Javadoc)
	 * @see bzq.forms.BaseForm#getFieldsMapping()
	 */
	public HashMap getFieldsMapping() {
		return null;
	}

	/**
	 * @return
	 */
	public int getJob() {
		return job;
	}

	/**
	 * @return
	 */
	public int getMoked() {
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
	public int getTeam() {
		return team;
	}

	/**
	 * @param i
	 */
	public void setJob(int i) {
		job = i;
	}

	/**
	 * @param i
	 */
	public void setMoked(int i) {
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
	public void setTeam(int i) {
		team = i;
	}


}
