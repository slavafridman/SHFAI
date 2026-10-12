package bzq.shf.forms;

import java.util.HashMap;

import bzq.shf.bean.ShfBaseBean;

public class BuildingForm extends ShfBaseBean {

	
	private static final long serialVersionUID = 6465005181317499020L;

	protected int code;
	protected String name;
	protected int seatsNum;
	protected String address;
	protected String orgUnit;
	protected String action;
	
	private static HashMap<String, String> fieldsMapping;
	static{
		fieldsMapping=new HashMap<String, String>();
		fieldsMapping.put("ID", "code");
		fieldsMapping.put("NAME", "name");
		fieldsMapping.put("SEATS_NUMBER", "seatsNum");
		fieldsMapping.put("ADDRESS", "address");
		fieldsMapping.put("ORG_UNIT_CODE", "orgUnit");
	}
	
	public int getSeatsNum() {
		return seatsNum;
	}
	
	public void setSeatsNum(int seatsNum) {
		this.seatsNum = seatsNum;
	}
	
	public String getAddress() {
		return address;
	}
	
	public void setAddress(String address) {
		this.address = address;
	}
	
	public String getOrgUnit() {
		return orgUnit;
	}
	
	public void setOrgUnit(String orgUnit) {
		this.orgUnit = orgUnit;
	}

		
	public int getCode() {
		return code;
	}

	public void setCode(int code) {
		this.code = code;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	
	

	public String getAction() {
		return action;
	}

	public void setAction(String action) {
		this.action = action;
	}

	@Override
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}
	
	
	
}
