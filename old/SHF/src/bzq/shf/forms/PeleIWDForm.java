package bzq.shf.forms;

public class PeleIWDForm extends TableForm {
	
	protected String agaf;
	protected String[] module;
	protected String[] moked;
	protected String[] innerJob;
	
	protected int amountPerTiming;
	protected int intervalSize;
	protected int totalForTiming;
	protected int moduleId;
	protected String mokedId;
	protected int innerJobId;
	
	protected String userAgaf;
	
	public String[] getModule() {
		return module;
	}
	public void setModule(String[] module) {
		this.module = module;
	}
	public String getAgaf() {
		return agaf;
	}
	public void setAgaf(String agaf) {
		this.agaf = agaf;
	}
	public String[] getMoked() {
		return moked;
	}
	public void setMoked(String[] moked) {
		this.moked = moked;
	}
	public String[] getInnerJob() {
		return innerJob;
	}
	public void setInnerJob(String[] innerJob) {
		this.innerJob = innerJob;
	}
	
	public int getIntervalSize() {
		return intervalSize;
	}
	public void setIntervalSize(int intervalSize) {
		this.intervalSize = intervalSize;
	}
	public int getTotalForTiming() {
		return totalForTiming;
	}
	public void setTotalForTiming(int totalForTiming) {
		this.totalForTiming = totalForTiming;
	}
	public int getAmountPerTiming() {
		return amountPerTiming;
	}
	public void setAmountPerTiming(int amountPerTiming) {
		this.amountPerTiming = amountPerTiming;
	}
	public int getModuleId() {
		return moduleId;
	}
	public void setModuleId(int moduleId) {
		this.moduleId = moduleId;
	}
	public String getMokedId() {
		return mokedId;
	}
	public void setMokedId(String mokedId) {
		this.mokedId = mokedId;
	}
	public int getInnerJobId() {
		return innerJobId;
	}
	public void setInnerJobId(int innerJobId) {
		this.innerJobId = innerJobId;
	}
	public String getUserAgaf() {
		return userAgaf;
	}
	public void setUserAgaf(String userAgaf) {
		this.userAgaf = userAgaf;
	}
	public void copyForm(PeleIWDForm other) {
		this.module = other.getModule();
		this.moked = other.getMoked();
		this.innerJob = other.getInnerJob();
		this.agaf = other.getAgaf();
		
	}
}
