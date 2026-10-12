package bzq.shf.forms;

import java.util.Date;
import java.util.HashMap;

public class SoftPhoneForm extends bzq.forms.BaseForm {

	private static final long serialVersionUID = 1L;

	public SoftPhoneForm () {
		super();
	}
	
	//--- BREAKS --------------------
	protected String employee_id;
	protected long agent_day_id;
	protected Date start_date_planned;
	protected Date start_date_updated;
	protected Date end_date_updated;
	
	//--- LOGOUT --------------------
	protected String uid;
	protected Date date;
	protected String param;
	

	public String getEmployee_id() {
		return employee_id;
	}

	public void setEmployee_id(String employee_id) {
		this.employee_id = employee_id;
	}

	public long getAgent_day_id() {
		return agent_day_id;
	}

	public void setAgent_day_id(long agent_day_id) {
		this.agent_day_id = agent_day_id;
	}
	
	public Date getStart_date_planned() {
		return start_date_planned;
	}

	public void setStart_date_planned(Date start_date_planned) {
		this.start_date_planned = start_date_planned;
	}

	public Date getStart_date_updated() {
		return start_date_updated;
	}

	public void setStart_date_updated(Date start_date_updated) {
		this.start_date_updated = start_date_updated;
	}

	public Date getEnd_date_updated() {
		return end_date_updated;
	}

	public void setEnd_date_updated(Date end_date_updated) {
		this.end_date_updated = end_date_updated;
	}

	public String getUid() {
		return uid;
	}

	public void setUid(String uid) {
		this.uid = uid;
	}

	public Date getDate() {
		return date;
	}

	public void setDate(Date date) {
		this.date = date;
	}

	public String getParam() {
		return param;
	}

	public void setParam(String param) {
		this.param = param;
	}

	@Override
	public HashMap<String, String> getFieldsMapping() {
		// TODO Auto-generated method stub
		return null;
	}

}
