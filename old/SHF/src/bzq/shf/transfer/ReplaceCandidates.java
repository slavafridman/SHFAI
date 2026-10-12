package bzq.shf.transfer;

import java.util.Date;
import java.util.HashMap;

import bzq.shf.bean.ShfBaseBean;

public class ReplaceCandidates extends ShfBaseBean {
	private int shiftId;
	private Date creationDate;
	private String status;
	private String errReason;
	private Date modifiedDate;
	private int offer;
	
	protected static HashMap fieldsMapping = null;
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("SHF_EMPLOYEE_DAY_ID", "shiftId");
		fieldsMapping.put("CREATION_DATE", "creationDate");
		fieldsMapping.put("STATUS", "status");
		fieldsMapping.put("ERR_REASON", "errReason");
		fieldsMapping.put("MODIFIED_DATE", "modifiedDate");
		fieldsMapping.put("OFFER", "offer");
	}

	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}

	public void setShiftId(int shiftId) {
		this.shiftId = shiftId;
	}

	public int getShiftId() {
		return shiftId;
	}

	public void setCreationDate(Date creationDate) {
		this.creationDate = creationDate;
	}

	public Date getCreationDate() {
		return creationDate;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getStatus() {
		return status;
	}

	public void setErrReason(String errReason) {
		this.errReason = errReason;
	}

	public String getErrReason() {
		return errReason;
	}

	public void setModifiedDate(Date modifiedDate) {
		this.modifiedDate = modifiedDate;
	}

	public Date getModifiedDate() {
		return modifiedDate;
	}

	public void setOffer(int offer) {
		this.offer = offer;
	}

	public int getOffer() {
		return offer;
	}

}
