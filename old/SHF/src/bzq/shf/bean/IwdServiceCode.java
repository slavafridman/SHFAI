package bzq.shf.bean;

import java.util.HashMap;

public class IwdServiceCode extends ShfBaseBean {
	
	protected static HashMap fieldsMapping = null;
	
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("ORG_UNIT_ID", "orgUnitId");
		fieldsMapping.put("IWD_CODE", "iwdCode");		
	}
	
	protected String orgUnitId;
	protected String iwdCode;

	public String getOrgUnitId() {
		return orgUnitId;
	}

	public void setOrgUnitId(String orgUnitId) {
		this.orgUnitId = orgUnitId;
	}

	public String getIwdCode() {
		return iwdCode;
	}

	public void setIwdCode(String iwdCode) {
		this.iwdCode = iwdCode;
	}

	@Override
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}
}
