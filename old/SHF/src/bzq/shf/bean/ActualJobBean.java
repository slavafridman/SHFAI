package bzq.shf.bean;

import java.util.Date;
import java.util.HashMap;

public class ActualJobBean extends ShfBaseBean{
		
		protected static HashMap fieldsMapping = null;
		static {
			fieldsMapping = new HashMap();
			fieldsMapping.put("JOB_ID", "jobId");
			fieldsMapping.put("JOB_NAME", "jobName");
			fieldsMapping.put("CATEGORY_ID", "categoryId");
			fieldsMapping.put("CATEGORY_DESCRIPTION", "categoryName");
			
		}
		public HashMap getFieldsMapping() {
			return fieldsMapping;
		}
		public ActualJobBean(){
			super();
		}
		protected Integer jobId;
		protected String jobName;
		protected Integer categoryId;
		protected String categoryName;
		public Integer getJobId() {
			return jobId;
		}
		public void setJobId(Integer jobId) {
			this.jobId = jobId;
		}
		public String getJobName() {
			return jobName;
		}
		public void setJobName(String jobName) {
			this.jobName = jobName;
		}
		public Integer getCategoryId() {
			return categoryId;
		}
		public void setCategoryId(Integer categoryId) {
			this.categoryId = categoryId;
		}
		public String getCategoryName() {
			return categoryName;
		}
		public void setCategoryName(String categoryName) {
			this.categoryName = categoryName;
		}
		public static void setFieldsMapping(HashMap fieldsMapping) {
			ActualJobBean.fieldsMapping = fieldsMapping;
		}
		
		
		
	
}

