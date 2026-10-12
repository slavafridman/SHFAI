package bzq.shf.bean;

public class PoolExtAllocBean {
	private long requestId;
	private String messageSendTime;
	private int techMessageCode;
	private String techMessageDesc;
	private int extensionId;
	private long dayId;
	private String requestType;
	private String agentId;
	private boolean isDayChanges; 
	private String empCellNum;
	private String displayMsg;

	public long getRequestId() {
		return requestId;
	}

	public void setRequestId(long requestId) {
		this.requestId = requestId;
	}

	public String getMessageSendTime() {
		return messageSendTime;
	}

	public void setMessageSendTime(String messageSendTime) {
		this.messageSendTime = messageSendTime;
	}

	public int getTechMessageCode() {
		return techMessageCode;
	}

	public void setTechMessageCode(int techMessageCode) {
		this.techMessageCode = techMessageCode;
	}

	public String getTechMessageDesc() {
		return techMessageDesc;
	}

	public void setTechMessageDesc(String techMessageDesc) {
		this.techMessageDesc = techMessageDesc;
	}

	public int getExtensionId() {
		return extensionId;
	}

	public void setExtensionId(int extensionId) {
		this.extensionId = extensionId;
	}

	public long getDayId() {
		return dayId;
	}

	public void setDayId(long dayId) {
		this.dayId = dayId;
	}

	public String getRequestType() {
		return requestType;
	}

	public void setRequestType(String requestType) {
		this.requestType = requestType;
	}

	public String getAgentId() {
		return agentId;
	}

	public void setAgentId(String agentId) {
		this.agentId = agentId;
	}

	public boolean isDayChanges() {
		return isDayChanges;
	}

	public void setDayChanges(boolean isDayChanges) {
		this.isDayChanges = isDayChanges;
	}

	public String getEmpCellNum() {
		return empCellNum;
	}

	public void setEmpCellNum(String empCellNum) {
		this.empCellNum = empCellNum;
	}

	public String getDisplayMsg() {
		return displayMsg;
	}

	public void setDisplayMsg(String displayMsg) {
		this.displayMsg = displayMsg;
	}



}
