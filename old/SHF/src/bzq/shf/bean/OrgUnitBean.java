package bzq.shf.bean;

import bzq.shf.forms.TableForm;

public class OrgUnitBean extends TableForm{
	
	static {
		fieldsMapping.put("ORG_UNIT_ID","orgUnit");
		fieldsMapping.put("ORG_UNIT_NAME","orgUnitName");
		fieldsMapping.put("PARENT_UNIT","ParentUnit");
		fieldsMapping.put("UNIT_TYPE_ID","unitTypeId");
	}
	
	private String orgUnit;
	private String orgUnitName;
	private String ParentUnit;
	private String unitTypeId;
	public String getOrgUnit() {
		return orgUnit;
	}
	public void setOrgUnit(String orgUnit) {
		this.orgUnit = orgUnit;
	}
	public String getOrgUnitName() {
		return orgUnitName;
	}
	public void setOrgUnitName(String orgUnitName) {
		this.orgUnitName = orgUnitName;
	}
	public String getParentUnit() {
		return ParentUnit;
	}
	public void setParentUnit(String parentUnit) {
		ParentUnit = parentUnit;
	}
	public String getUnitTypeId() {
		return unitTypeId;
	}
	public void setUnitTypeId(String unitTypeId) {
		this.unitTypeId = unitTypeId;
	}
		
	
}