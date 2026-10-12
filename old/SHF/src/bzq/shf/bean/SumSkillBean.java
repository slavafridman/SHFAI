/*
 * Created on 28/01/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.bean;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class SumSkillBean extends EmployeeSkillBean {
		protected int skillSum=0;
		protected int arrivedSum;
		protected int missSum;
		protected int notRegisterSum;


		public SumSkillBean(){
			arrivedSum=0;
			missSum=0;
			notRegisterSum=0;
		}
		/**
		 * @return
		 */
		public int getArrivedSum() {
			return arrivedSum;
		}

		/**
		 * @return
		 */
		public int getMissSum() {
			return missSum;
		}

		/**
		 * @return
		 */
		public int getNotRegisterSum() {
			return notRegisterSum;
		}

		/**
		 * @param i
		 */
		public void setArrivedSum(int i) {
			arrivedSum = i;
		}

		/**
		 * @param i
		 */
		public void setMissSum(int i) {
			missSum = i;
		}

		/**
		 * @param i
		 */
		public void setNotRegisterSum(int i) {
			notRegisterSum = i;
		}
		public void incrementNotRegisterSum(int add){
			notRegisterSum=notRegisterSum+add;
		}
		public void incrementMissSum(int add){
			missSum=missSum+add;
		}
		public void incrementArrivedSum(int add){
			arrivedSum=arrivedSum+add;
		}
		public void incrementSkillSum(){
			skillSum=skillSum+1;
		}		
		/**
		 * @return
		 */
		public int getSkillSum() {
			return skillSum;
		}

		/**
		 * @param i
		 */
		public void setSkillSum(int i) {
			skillSum = i;
		}

}
