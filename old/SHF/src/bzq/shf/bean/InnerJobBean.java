package bzq.shf.bean;

import bzq.shf.forms.TableForm;

public class InnerJobBean extends TableForm{
	
	
	private static final long serialVersionUID = 3031071487782755528L;
	
	static {
		fieldsMapping.put("ORG_UNIT_ID","orgUnit");
		fieldsMapping.put("ACTIVE","active");
		fieldsMapping.put("GROUP_ID","groupId");
	}
	
	private String orgUnit;
	private int active;
	private String innerJobName;
	private int innerJobId;
	private int groupId;
	
	public String getOrgUnit() {
		return orgUnit;
	}
	public void setOrgUnit(String orgUnit) {
		this.orgUnit = orgUnit;
	}
	public int getActive() {
		return active;
	}
	public void setActive(int active) {
		this.active = active;
	}
	public String getInnerJobName() {
		return innerJobName;
	}
	public void setInnerJobName(String innerJobName) {
		this.innerJobName = innerJobName;
	}
	public int getInnerJobId() {
		return innerJobId;
	}
	public void setInnerJobId(int innerJobId) {
		this.innerJobId = innerJobId;
	}
	public int getGroupId() {
		return groupId;
	}
	public void setGroupId(int groupId) {
		this.groupId = groupId;
	}
	
	
	
}
