/*
 * Created on 27/07/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.bean;

import java.util.Date;


/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ChangeRequestCandidate extends AgentDayBean {
	static{
		fieldsMapping.put("CHANGE_REQUEST_ID","requestId");
		fieldsMapping.put("APPROVE_TIME","approveTime");
		fieldsMapping.put("MODIFICATION_USER","modificationUser");
		fieldsMapping.put("MODIFICATION_TIME","modificationTime");
		fieldsMapping.put("CREATION_TIME","creationTime");
	}
	
	protected long requestId;
	protected Date approveTime;
	protected String modificationUser;
	protected Date modificationTime;
	protected Date creationTime;
	
	/**
	 * @return
	 */
	public Date getApproveTime() {
		return approveTime;
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
	public String getModificationUser() {
		return modificationUser;
	}

	/**
	 * @return
	 */
	public long getRequestId() {
		return requestId;
	}

	/**
	 * @param date
	 */
	public void setApproveTime(Date date) {
		approveTime = date;
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
	public void setModificationUser(String string) {
		modificationUser = string;
	}

	/**
	 * @param l
	 */
	public void setRequestId(long l) {
		requestId = l;
	}

}
