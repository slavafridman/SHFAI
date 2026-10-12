package bzq.shf.bean;

import java.util.Date;
import java.util.HashMap;

public class BreakSMSBean extends ShfBaseBean {
	
	protected static HashMap fieldsMapping = null;
	
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("SMS_ID","smsId");
		fieldsMapping.put("AGENT_CEL_NUM","agentCelNum");
		fieldsMapping.put("AGENT_ID","agentId");
		fieldsMapping.put("SHIFT_DAY_ID","endshiftDayIdTime");
		fieldsMapping.put("BREAK_END","breakEnd");
		fieldsMapping.put("CREATION_DATE","creationDate");
		fieldsMapping.put("SMS_SENT_DATE","smsSentDate");
	}
	
	protected long smsId;
	protected String agentCelNum;
	protected String agentId;
	protected long shiftDayId;
	protected Date breakEnd;
	protected Date creationDate;
	protected Date smsSentDate;

	@Override
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}

	public static void setFieldsMapping(HashMap fieldsMapping) {
		BreakSMSBean.fieldsMapping = fieldsMapping;
	}

	public long getSmsId() {
		return smsId;
	}

	public void setSmsId(long smsId) {
		this.smsId = smsId;
	}

	public String getAgentCelNum() {
		return agentCelNum;
	}

	public void setAgentCelNum(String agentCelNum) {
		this.agentCelNum = agentCelNum;
	}

	public String getAgentId() {
		return agentId;
	}

	public void setAgentId(String agentId) {
		this.agentId = agentId;
	}

	public long getShiftDayId() {
		return shiftDayId;
	}

	public void setShiftDayId(long shiftDayId) {
		this.shiftDayId = shiftDayId;
	}

	public Date getBreakEnd() {
		return breakEnd;
	}

	public void setBreakEnd(Date breakEnd) {
		this.breakEnd = breakEnd;
	}

	public Date getCreationDate() {
		return creationDate;
	}

	public void setCreationDate(Date creationDate) {
		this.creationDate = creationDate;
	}

	public Date getSmsSentDate() {
		return smsSentDate;
	}

	public void setSmsSentDate(Date smsSentDate) {
		this.smsSentDate = smsSentDate;
	}

}
